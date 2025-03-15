# 🎟️ Coupon Distributor - Round Robin System

A full-stack web application that distributes coupons in a fair round-robin system while preventing abuse using IP tracking, cookies, and rate limiting.

## 📌 Features
- ✅ **Round-Robin Coupon Assignment** - Ensures fair coupon distribution
- ✅ **Guest Access** - Users can claim coupons without registering
- ✅ **Abuse Prevention Strategies**:
  - **IP Address Tracking** - Prevents multiple claims within 1 hour
  - **Cookie-Based Tracking** - Stops users from refreshing to claim again
  - **Rate Limiting** - Prevents bots from spamming requests
- ✅ **Persistent Coupon History** - Users see previously claimed coupons
- ✅ **Deployed on Vercel** - Fully hosted as a serverless function

---

## 🚀 Live Demo
🔗 **[Visit the Live App](https://coupon-distributor.vercel.app/)**

---

## ⚙️ Setup Instructions

### **1️⃣ Clone the Repository**
```sh
git clone https://github.com/Joyyojpeed/CouponDistributor.git
cd CouponDistributor
```

### **2️⃣ Install Dependencies**
```sh
npm install
```

### **3️⃣ Configure MongoDB**
- Create a MongoDB Atlas Cluster ([MongoDB Atlas](https://www.mongodb.com/cloud/atlas)).
- Copy your MongoDB Connection String.

Example:
```ini
mongodb+srv://your-username:password@cluster.mongodb.net/couponApp
```

- Create a `.env` file in the root of your project and add:
```ini
MONGODB_URI=mongodb+srv://your-username:password@cluster.mongodb.net/couponApp
COOKIE_SECRET=your-secret-key
```

### **4️⃣ Run the Project Locally**
```sh
npm start
```
🔗 Open [http://localhost:3000/](http://localhost:3000/) in your browser.

---

## 🌍 Deployment on Vercel

### **1️⃣ Deploy Using Vercel CLI**
- Install Vercel:
```sh
npm install -g vercel
```

- Log in:
```sh
vercel login
```

- Deploy:
```sh
vercel
```

### **2️⃣ Set Environment Variables on Vercel**
- Go to Vercel Dashboard → Project Settings → Environment Variables
- Add:
```ini
MONGODB_URI=mongodb+srv://your-username:password@cluster.mongodb.net/couponApp
COOKIE_SECRET=your-secret-key
```
- Redeploy the app.

---

## 🔒 Abuse Prevention Strategies

### **1️⃣ IP Address Tracking**
Limits coupon claims per IP within 1 hour.
```javascript
const existingClaim = await claimsCollection.findOne({ ip: userIP });
if (existingClaim && (Date.now() - existingClaim.timestamp) < 3600000) {
  return res.status(429).json({ message: "You have already claimed a coupon. Try again later." });
}
```

### **2️⃣ Secure HTTP-Only Cookies**
Prevents refresh-based abuse.
```javascript
res.cookie('couponClaimed', true, { 
  maxAge: 3600000, 
  httpOnly: true, 
  secure: true, 
  signed: true, 
  sameSite: 'strict'
});
```

### **3️⃣ Rate Limiting (Prevents Spam Requests)**
Limits API calls to 100 per 15 minutes.
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, try again later.',
});

app.use(limiter);
```

### **4️⃣ Round-Robin Coupon Assignment**
Ensures coupons are distributed fairly.
```javascript
let indexDoc = await indexCollection.findOne({ _id: 'currentIndex' });

const coupon = coupons[indexDoc.value];
const newIndex = (indexDoc.value + 1) % coupons.length;

await indexCollection.updateOne(
  { _id: 'currentIndex' },
  { $set: { value: newIndex } }
);
```

---

## 🛠️ How to Test the System

### **1️⃣ Test Coupon Claiming**
- Visit: [https://coupon-distributor.vercel.app](https://coupon-distributor.vercel.app)
- Click "Claim Your Coupon"
- See if you receive a coupon.
- ✅ If a user tries again within an hour, they should be blocked.

### **2️⃣ Test Rate Limiting**
- Open Developer Tools → Console
- Run this script:
```javascript
for (let i = 0; i < 105; i++) {
  fetch("https://coupon-distributor.vercel.app/claim")
    .then(response => console.log(response.status))
    .catch(error => console.error(error));
}
```
- ✅ After 100 requests, the API should return:
```json
{ "message": "Too many requests from this IP, try again later." }
```

### **3️⃣ Test Coupon History**
- Visit [https://coupon-distributor.vercel.app](https://coupon-distributor.vercel.app)
- Check if past coupons appear under "Your Coupon History".
- ✅ If history persists even after page refresh, it works!

---

## ✅ Conclusion
- Coupons are distributed fairly using a round-robin system.
- Abuse is prevented through IP tracking, cookies, and rate limiting.
- MongoDB ensures persistent coupon history.
- Vercel handles serverless deployment.

---

## 📝 Author
👤 Joyyojpeed
🔗 GitHub Repository: [CouponDistributor](https://github.com/Joyyojpeed/CouponDistributor)
