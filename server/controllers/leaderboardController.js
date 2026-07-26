const asyncHandler = require("express-async-handler");
const Review = require("../models/Review");
const Submission = require("../models/Submission");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// @desc    Get leaderboard for a hackathon
// @route   GET /api/leaderboard/:hackathonId
// @access  Auth
const getLeaderboard = asyncHandler(async (req, res) => {
  const hackathonId = req.params.hackathonId;

  const mongoose = require("mongoose");
  if (!mongoose.Types.ObjectId.isValid(hackathonId)) {
    throw new ApiError(400, "Invalid Hackathon ID");
  }

  // Aggregate: for each submission, compute average totalScore across all judges
  const leaderboard = await Review.aggregate([
    { $match: { hackathon: new mongoose.Types.ObjectId(hackathonId) } },
    {
      $group: {
        _id: "$submission",
        averageScore: { $avg: "$totalScore" },
        totalScore: { $sum: "$totalScore" },
        reviewCount: { $sum: 1 },
        judges: { $push: "$judge" },
      },
    },
    { $sort: { averageScore: -1 } },
    {
      $lookup: {
        from: "submissions",
        localField: "_id",
        foreignField: "_id",
        as: "submission",
      },
    },
    { $unwind: "$submission" },
    {
      $lookup: {
        from: "teams",
        localField: "submission.team",
        foreignField: "_id",
        as: "team",
      },
    },
    { $unwind: "$team" },
    {
      $project: {
        submission: {
          _id: 1,
          projectName: 1,
          githubRepo: 1,
          liveDemoUrl: 1,
          techStack: 1,
          screenshots: { $slice: ["$submission.screenshots", 1] },
        },
        team: { _id: 1, name: 1 },
        averageScore: { $round: ["$averageScore", 2] },
        totalScore: 1,
        reviewCount: 1,
      },
    },
  ]);

  // Add rank
  const ranked = leaderboard.map((entry, idx) => ({
    rank: idx + 1,
    ...entry,
  }));

  res.status(200).json(new ApiResponse(200, { leaderboard: ranked }, "Leaderboard fetched"));
});

module.exports = { getLeaderboard };
