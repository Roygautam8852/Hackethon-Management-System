const connectDB = require("./config/db");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

connectDB().then(async () => {
  let u = await User.findOne({ email: "admin@hacklytics.com" });
  if (!u) {
    u = new User({ name: "System Admin", email: "admin@hacklytics.com", role: "admin" });
  }
  const hashed = await bcrypt.hash("admin123", 12);
  await User.collection.updateOne(
    { email: "admin@hacklytics.com" },
    { $set: { password: hashed, role: "admin", isBlocked: false } },
    { upsert: true }
  );
  console.log("Admin account set with bcrypt password 'admin123'");
  
  const check = await User.findOne({ email: "admin@hacklytics.com" }).select("+password");
  const ok = await bcrypt.compare("admin123", check.password);
  console.log("Bcrypt comparison test:", ok ? "PASSED ✅" : "FAILED ❌");
  process.exit(0);
});
