// backend/db.js
const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log("⚠️ MONGO_URI nije postavljen u .env");
    return false;
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB spojen");
    return true;
  } catch (err) {
    console.log("❌ MongoDB greška:", err.message);
    return false;
  }
}

module.exports = connectDB;
