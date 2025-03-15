# 🎟️ Coupon Distributor - Round Robin System

**A full-stack web application that distributes coupons in a fair round-robin system while preventing abuse using IP tracking, cookies, and rate limiting.**

## 📌 Features
✅ **Round-Robin Coupon Assignment** - Ensures fair coupon distribution  
✅ **Guest Access** - Users can claim coupons without registering  
✅ **Abuse Prevention Strategies**:  
   - **IP Address Tracking** - Prevents multiple claims within 1 hour  
   - **Cookie-Based Tracking** - Stops users from refreshing to claim again  
   - **Rate Limiting** - Prevents bots from spamming requests  
✅ **Persistent Coupon History** - Users see previously claimed coupons  
✅ **Deployed on Vercel** - Fully hosted as a serverless function  

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
1. Create a MongoDB Atlas Cluster ([MongoDB Atlas](https://www.mongodb.com/cloud/atlas)).
2. Copy your MongoDB Connection String.

   **Example:**
   ```bash
   mongodb+srv://your-username:password@cluster.mongodb.net/couponApp
   ```
3. Create a .env file in the root of your project and add:
   ```bash
   MONGODB_URI=mongodb+srv://your-username:password@cluster.mongodb.net/couponApp
   COOKIE_SECRET=your-secret-key
   ```
### **4️⃣ Run the Project Locally**
   ```
   npm start
   ```
🔗 Open http://localhost:3000/ in your browser.


