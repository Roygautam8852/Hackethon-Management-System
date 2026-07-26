const express = require("express");
const router = express.Router();
const { getLeaderboard } = require("../controllers/leaderboardController");

// Public route — leaderboard is visible to everyone
router.get("/:hackathonId", getLeaderboard);

module.exports = router;
