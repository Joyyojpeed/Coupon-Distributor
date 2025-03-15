// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors'); // Import the cors package
const cookieParser = require('cookie-parser');
const { MongoClient } = require('mongodb');
const rateLimit = require('express-rate-limit');

const app = express();

// MongoDB connection string (loaded from .env)
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// In-memory coupon list
let coupons = ["COUPON1", "COUPON2", "COUPON3", "COUPON4"];

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes.',
});

// Apply rate limiter to all requests
app.use(limiter);


const allowedOrigins = [
  'https://coupon-distributor.vercel.app', // ✅ Main Production Deployment
  /\.vercel\.app$/ // ✅ Dynamically allows all Vercel preview deployments
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.some(pattern => pattern instanceof RegExp ? pattern.test(origin) : pattern === origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET)); // Use a secret key for signed cookies
const path = require('path');

app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// Serve index.html explicitly for `/`
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.error('❌ Error connecting to MongoDB Atlas:', err);
    process.exit(1);
  }
}
connectToMongoDB();

// Helper function to get the user's IP address
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
}

// Endpoint to claim a coupon
app.get('/claim', async (req, res) => {
  const userIP = getClientIP(req); // Get the user's IP address
  const userCookie = req.signedCookies.couponClaimed; // Use signed cookies

  // Check IP-based restriction
  const db = client.db('couponApp');
  const claimsCollection = db.collection('claims');
  const historyCollection = db.collection('assignmentHistory');
  const indexCollection = db.collection('couponIndex');

  const existingClaim = await claimsCollection.findOne({ ip: userIP });

  if (existingClaim && (Date.now() - existingClaim.timestamp) < 3600000) {
    const remainingTime = Math.ceil((3600000 - (Date.now() - existingClaim.timestamp)) / 1000); // Calculate remaining time in seconds
    return res.status(429).json({ 
      message: `You have already claimed a coupon. Please try again in sometime.`,
      remainingTime: remainingTime // Send remaining time to the frontend
    });
  }

  // Check cookie-based restriction
  if (userCookie) {
    return res.status(429).json({ message: `You have already claimed a coupon in this session.` });
  }

  // Fetch the current index from the database
  let indexDoc = await indexCollection.findOne({ _id: 'currentIndex' });
  if (!indexDoc) {
    // Initialize the index if it doesn't exist
    await indexCollection.insertOne({ _id: 'currentIndex', value: 0 });
    indexDoc = { value: 0 };
  }

  // Assign coupon
  if (coupons.length === 0) {
    return res.status(500).json({ message: 'No coupons available.' });
  }

  const coupon = coupons[indexDoc.value];
  const newIndex = (indexDoc.value + 1) % coupons.length;

  // Update the index in the database
  await indexCollection.updateOne(
    { _id: 'currentIndex' },
    { $set: { value: newIndex } }
  );

  // Log the coupon assignment
  console.log(`✅ Assigned coupon: ${coupon} to IP: ${userIP}`);

  // Update IP claims in MongoDB
  await claimsCollection.updateOne(
    { ip: userIP },
    { $set: { ip: userIP, timestamp: Date.now() } },
    { upsert: true }
  );

  // Save coupon assignment history
  try {
    await historyCollection.insertOne({
      coupon: coupon,
      ip: userIP,
      timestamp: Date.now(),
    });
    console.log('✅ Coupon assignment saved to history:', { coupon, ip: userIP });
  } catch (err) {
    console.error('❌ Error saving coupon assignment history:', err);
  }

  // Set secure, HTTP-only, signed cookie
  res.cookie('couponClaimed', true, { 
    maxAge: 3600000, // 1 hour
    httpOnly: true, // Prevent client-side access
    secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
    signed: true, // Sign the cookie
    sameSite: 'strict', // Prevent CSRF attacks
  });

  // Send response
  res.json({ message: `Success! Your coupon is: ${coupon}` });
});

// Endpoint to fetch coupon history for a specific IP
app.get('/history', async (req, res) => {
  const userIP = getClientIP(req); // Get the user's IP address

  try {
    const db = client.db('couponApp');
    const historyCollection = db.collection('assignmentHistory');

    // Fetch all coupon assignments for the user's IP
    const history = await historyCollection.find({ ip: userIP }).toArray();

    // Log the query results for debugging
    console.log('📜 History Query Results:', history);

    // Send the history as a response
    res.json({ history });
  } catch (err) {
    console.error('❌ Error fetching coupon history:', err);
    res.status(500).json({ message: 'An error occurred while fetching history.' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unexpected error:', err);
  res.status(500).json({ message: 'An unexpected error occurred. Please try again.' });
});

// Export the app for Vercel
module.exports = app;