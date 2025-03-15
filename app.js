// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const { MongoClient } = require('mongodb');

const app = express();

// MongoDB connection string (loaded from .env)
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// In-memory coupon list
let coupons = ["COUPON1", "COUPON2", "COUPON3", "COUPON4"];
let currentIndex = 0;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public')); // Serve static files (HTML, CSS, JS)

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
  const userCookie = req.cookies.couponClaimed;

  // Check IP-based restriction
  const db = client.db('couponApp');
  const claimsCollection = db.collection('claims');
  const historyCollection = db.collection('assignmentHistory');

  const existingClaim = await claimsCollection.findOne({ ip: userIP });

  if (existingClaim && (Date.now() - existingClaim.timestamp) < 3600000) {
    return res.status(429).json({ message: `You have already claimed a coupon. Please try again after 1 hour.` });
  }

  // Check cookie-based restriction
  if (userCookie) {
    return res.status(429).json({ message: `You have already claimed a coupon in this session.` });
  }

  // Assign coupon
  if (coupons.length === 0) {
    return res.status(500).json({ message: 'No coupons available.' });
  }

  const coupon = coupons[currentIndex];
  currentIndex = (currentIndex + 1) % coupons.length;

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

  // Set cookie
  res.cookie('couponClaimed', true, { maxAge: 3600000 });

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

// 🔹 REMOVE `app.listen()` and EXPORT the app for Vercel
module.exports = app;
