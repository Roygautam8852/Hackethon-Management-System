const mongoose = require("mongoose");
const dns = require("dns");

// Ensure Node on Windows can resolve MongoDB Atlas SRV records reliably
if (process.platform === "win32") {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch (_) {}
}

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  const primaryUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hacklytics";

  try {
    const conn = await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`⚠️ MongoDB Connection Failed: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
