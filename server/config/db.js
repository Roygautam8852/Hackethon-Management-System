const mongoose = require("mongoose");
const dns = require("dns");

// Ensure Node on Windows can resolve MongoDB Atlas SRV records reliably
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (_) {}

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  const primaryUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hacklytics";
  const localFallbackUri = "mongodb://127.0.0.1:27017/hacklytics";

  try {
    const conn = await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`⚠️ Primary MongoDB Connection Failed: ${error.message}`);
    if (primaryUri !== localFallbackUri) {
      console.log(`🔄 Falling back to local MongoDB...`);
      try {
        const localConn = await mongoose.connect(localFallbackUri, { serverSelectionTimeoutMS: 3000 });
        console.log(`✅ Local MongoDB Connected: ${localConn.connection.host}`);
      } catch (localErr) {
        console.error(`❌ Local MongoDB Fallback Failed: ${localErr.message}`);
      }
    }
  }
};

module.exports = connectDB;
