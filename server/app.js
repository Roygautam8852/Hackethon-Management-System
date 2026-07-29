const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const hackathonRoutes = require("./routes/hackathonRoutes");
const teamRoutes = require("./routes/teamRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();

// CORS — allow frontend origin(s)
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "https://hackathon-management-system.vercel.app",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, mobile apps, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin '${origin}' not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/hackathons", hackathonRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/messages", messageRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
