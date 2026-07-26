const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config();

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (_) {}

async function main() {
  const primaryUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hacklytics";
  const localUri = "mongodb://127.0.0.1:27017/hacklytics";

  let connected = false;
  try {
    console.log("Connecting to primary URI...");
    await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to Primary MongoDB!");
    connected = true;
  } catch (err) {
    console.log("Primary connection failed:", err.message);
    console.log("Connecting to Local MongoDB fallback...");
    try {
      await mongoose.connect(localUri, { serverSelectionTimeoutMS: 5000 });
      console.log("Connected to Local MongoDB!");
      connected = true;
    } catch (lErr) {
      console.log("Local connection failed:", lErr.message);
    }
  }

  if (!connected) {
    console.error("Could not connect to any MongoDB instance.");
    process.exit(1);
  }

  const collections = await mongoose.connection.db.collections();
  console.log(`Found ${collections.length} collections.`);
  for (const col of collections) {
    const res = await col.deleteMany({});
    console.log(`Cleared collection '${col.collectionName}': removed ${res.deletedCount} documents.`);
  }

  console.log("Database clear completed successfully.");
  await mongoose.disconnect();
  process.exit(0);
}

main();
