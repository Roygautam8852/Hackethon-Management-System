require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");
const Hackathon = require("../models/Hackathon");
const Team = require("../models/Team");
const Registration = require("../models/Registration");
const Submission = require("../models/Submission");
const Review = require("../models/Review");

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hacklytics";
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    // Clear existing data
    await User.deleteMany({});
    await Hackathon.deleteMany({});
    await Team.deleteMany({});
    await Registration.deleteMany({});
    await Submission.deleteMany({});
    await Review.deleteMany({});
    console.log("Cleared existing collections.");

    // 1. Create Users
    const admin = await User.create({
      name: "System Admin",
      email: "admin@hacklytics.com",
      password: "Password123!",
      role: "admin",
      bio: "Master administrator for the Hacklytics platform.",
    });

    const organizer = await User.create({
      name: "Sarah Jenkins",
      email: "organizer@hacklytics.com",
      password: "Password123!",
      role: "organizer",
      isApproved: true,
      bio: "Lead Hackathon Director at Tech Campus Union.",
    });

    const judge = await User.create({
      name: "Dr. Alex Vance",
      email: "judge@hacklytics.com",
      password: "Password123!",
      role: "judge",
      isApproved: true,
      bio: "Principal AI Research Scientist & Hackathon Evaluator.",
    });

    const participant = await User.create({
      name: "Gautam Kumar",
      email: "participant@hacklytics.com",
      password: "Password123!",
      role: "participant",
      bio: "Full-Stack Software Engineer & AI Builder.",
      skills: ["React", "Node.js", "MongoDB", "Python", "TailwindCSS"],
    });

    const dev2 = await User.create({
      name: "Priya Sharma",
      email: "priya@hacklytics.com",
      password: "Password123!",
      role: "participant",
      bio: "UI/UX & Frontend Specialist.",
      skills: ["React", "Figma", "CSS3", "Vite"],
    });

    console.log("Created Demo Accounts (Password: Password123!):");
    console.log(" - Admin: admin@hacklytics.com");
    console.log(" - Organizer: organizer@hacklytics.com");
    console.log(" - Judge: judge@hacklytics.com");
    console.log(" - Participant: participant@hacklytics.com");

    // 2. Create Sample Hackathons
    const hackathon1 = await Hackathon.create({
      title: "National AI & Agentic Hackathon 2026",
      theme: "Artificial Intelligence & Autonomous Systems",
      tagline: "Build Next-Gen Autonomous AI Agents & Intelligent SaaS Systems",
      description: "Join developers across the nation to build production-grade AI agents, autonomous workflow tools, and intelligent developer automation.",
      banner: "/hackathon_hero.jpg",
      mode: "hybrid",
      location: "San Francisco, CA & Remote",
      organizer: organizer._id,
      judges: [judge._id],
      status: "ongoing",
      registrationOpen: true,
      isPublished: true,
      registrationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      maxTeamSize: 4,
      minTeamSize: 1,
      prizePool: "$15,000 USD",
      prizes: [
        { position: "1st Place", reward: "$8,000", description: "Grand Prize Winner" },
        { position: "2nd Place", reward: "$4,000", description: "Runner Up" },
        { position: "Best AI Innovation", reward: "$3,000", description: "Special Category" },
      ],
      rules: [
        "All code must be written during the hackathon timeline.",
        "Repos must contain a working README and setup steps.",
        "Team size must be between 1 and 4 members.",
      ],
      judgingCriteria: [
        { criterion: "Innovation & Originality", maxMarks: 25, weightage: 25 },
        { criterion: "Technical Complexity", maxMarks: 30, weightage: 30 },
        { criterion: "UI & User Experience", maxMarks: 25, weightage: 25 },
        { criterion: "Market Scalability", maxMarks: 20, weightage: 20 },
      ],
      tags: ["AI", "MERN", "React", "Node.js", "Python"],
    });

    const hackathon2 = await Hackathon.create({
      title: "Global Web3 & Decentralized Hackathon",
      theme: "Web3, Blockchain & Decentralized Finance",
      tagline: "Revolutionizing Peer-to-Peer Finance & Smart Contracts",
      description: "Build decentralized finance protocols, automated smart contracts, and Web3 user interfaces.",
      banner: "/hackathon_hero.jpg",
      mode: "online",
      location: "Virtual Online",
      organizer: organizer._id,
      judges: [judge._id],
      status: "upcoming",
      registrationOpen: true,
      isPublished: true,
      registrationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      maxTeamSize: 4,
      minTeamSize: 2,
      prizePool: "$25,000 USD",
      prizes: [
        { position: "1st Place", reward: "$15,000", description: "Web3 Grand Winner" },
        { position: "2nd Place", reward: "$10,000", description: "DeFi Innovation" },
      ],
      rules: ["Smart contracts must be deployed on testnet."],
      judgingCriteria: [
        { criterion: "Security & Code Quality", maxMarks: 50, weightage: 50 },
        { criterion: "User Interface", maxMarks: 50, weightage: 50 },
      ],
      tags: ["Web3", "Blockchain", "Solidity"],
    });

    console.log("Created Sample Hackathons.");

    // 3. Create Sample Team & Registration
    const team = await Team.create({
      name: "Neural Hackers",
      hackathon: hackathon1._id,
      leader: participant._id,
      members: [
        { user: participant._id, role: "Leader", status: "accepted" },
        { user: dev2._id, role: "Frontend Lead", status: "accepted" },
      ],
      inviteCode: "NH2026X",
    });

    await Registration.create({
      registeredBy: participant._id,
      hackathon: hackathon1._id,
      team: team._id,
      status: "approved",
    });

    // 4. Create Sample Submission
    const submission = await Submission.create({
      hackathon: hackathon1._id,
      team: team._id,
      projectName: "Hacklytics AI Agent Suite",
      tagline: "Autonomous MERN Hackathon Management Platform with Aggregated Leaderboards",
      problemStatement: "Colleges and organizations struggle with fragmented hackathon management tools.",
      solutionDescription: "An end-to-end full-stack hackathon management suite built on React 18, Express, MongoDB, and Tailwind CSS. Features automated RBAC, team invites, Cloudinary media vault, and live evaluation sliders.",
      repoUrl: "https://github.com/example/hacklytics",
      demoUrl: "https://hacklytics.app",
      videoUrl: "https://youtube.com/watch?v=demo",
      techStack: ["React", "Express", "MongoDB", "Cloudinary", "Node.js"],
      submittedBy: participant._id,
      status: "under_review",
    });

    // 5. Create Sample Review by Judge
    await Review.create({
      submission: submission._id,
      hackathon: hackathon1._id,
      judge: judge._id,
      scores: [
        { criterion: "Innovation & Originality", marks: 24, maxMarks: 25 },
        { criterion: "Technical Complexity", marks: 28, maxMarks: 30 },
        { criterion: "UI & User Experience", marks: 24, maxMarks: 25 },
        { criterion: "Market Scalability", marks: 18, maxMarks: 20 },
      ],
      totalScore: 94,
      feedback: "Exceptional architecture, sleek monochrome UI design, and outstanding MERN integration!",
    });

    // Update submission avgScore
    submission.averageScore = 94;
    submission.status = "approved";
    await submission.save();

    console.log("Database seeded successfully with demo data!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seedDatabase();
