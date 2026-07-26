const mongoose = require("mongoose");
const dns = require("dns");

// Force Node.js DNS resolution order to IPv4 first for Vercel/AWS Lambda serverless compatibility
try {
  dns.setDefaultResultOrder("ipv4first");
} catch (_) {}

if (process.platform === "win32") {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch (_) {}
}

let cachedPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!cachedPromise) {
    const primaryUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hacklytics";
    const opts = {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      family: 4,
    };

    cachedPromise = mongoose.connect(primaryUri, opts).then((m) => {
      console.log(`✅ MongoDB Connected: ${m.connection.host}`);
      return m.connection;
    }).catch((err) => {
      cachedPromise = null;
      console.error(`❌ MongoDB Connection Error: ${err.message}`);
      throw err;
    });
  }

  return await cachedPromise;
};

module.exports = connectDB;
