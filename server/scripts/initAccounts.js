require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const connectDB = require("../config/db");
const User = require("../models/User");

const initAccounts = async () => {
  await connectDB();

  // Create clean initial role accounts (no dummy hackathons/teams)
  const accounts = [
    {
      name: "System Admin",
      email: "admin@hacklytics.com",
      password: "Password123!",
      role: "admin",
      bio: "Platform Administrator",
    },
    {
      name: "Hackathon Organizer",
      email: "organizer@hacklytics.com",
      password: "Password123!",
      role: "organizer",
      bio: "Event Director",
    },
    {
      name: "Hackathon Judge",
      email: "judge@hacklytics.com",
      password: "Password123!",
      role: "judge",
      bio: "Project Evaluator",
    },
    {
      name: "Participant User",
      email: "participant@hacklytics.com",
      password: "Password123!",
      role: "participant",
      bio: "Developer & Hacker",
    },
  ];

  console.log("Creating initial role accounts...");
  for (const acc of accounts) {
    const existing = await User.findOne({ email: acc.email });
    if (!existing) {
      await User.create(acc);
      console.log(`✓ Created ${acc.role} account: ${acc.email}`);
    } else {
      console.log(`- ${acc.email} already exists`);
    }
  }

  console.log("\n✅ Initial role accounts ready! Database 'hacklytics' is now active.");
  process.exit(0);
};

initAccounts().catch(err => {
  console.error("Error initializing accounts:", err.message);
  process.exit(1);
});
