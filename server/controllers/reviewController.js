const asyncHandler = require("express-async-handler");
const Review = require("../models/Review");
const Submission = require("../models/Submission");
const Hackathon = require("../models/Hackathon");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// @desc    Submit a review
// @route   POST /api/reviews
// @access  Judge
const submitReview = asyncHandler(async (req, res) => {
  const { submissionId, hackathonId, scores, feedback } = req.body;

  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) throw new ApiError(404, "Hackathon not found");

  const submission = await Submission.findById(submissionId);
  if (!submission) throw new ApiError(404, "Submission not found");

  // Verify judge is assigned to hackathon or specifically to this submission
  const isAssignedToHackathon = hackathon.assignedJudges.some(
    j => j.toString() === req.user._id.toString()
  );
  const isAssignedToSubmission = !submission.assignedJudges || submission.assignedJudges.length === 0 ||
    submission.assignedJudges.some(j => j.toString() === req.user._id.toString());

  if (!isAssignedToHackathon && !isAssignedToSubmission && req.user.role !== "admin") {
    throw new ApiError(403, "You are not assigned as judge for this hackathon/submission");
  }

  const existingReview = await Review.findOne({
    submission: submissionId,
    judge: req.user._id,
  });
  if (existingReview) {
    throw new ApiError(409, "You have already reviewed this submission");
  }

  const parsedScores = typeof scores === "string" ? JSON.parse(scores) : scores;
  const totalScore = parsedScores.reduce((sum, s) => sum + s.marks, 0);

  const review = await Review.create({
    submission: submissionId,
    hackathon: hackathonId,
    judge: req.user._id,
    scores: parsedScores,
    totalScore,
    feedback,
  });

  // Update submission status to "under_review"
  if (submission.status === "pending") {
    submission.status = "under_review";
    await submission.save();
  }

  await review.populate("judge", "name avatar email");

  res.status(201).json(new ApiResponse(201, { review }, "Review submitted successfully"));
});

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Judge (own review)
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, "Review not found");

  if (review.judge.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to edit this review");
  }

  const { scores, feedback } = req.body;
  if (scores) {
    const parsedScores = typeof scores === "string" ? JSON.parse(scores) : scores;
    review.scores = parsedScores;
    review.totalScore = parsedScores.reduce((sum, s) => sum + s.marks, 0);
  }
  if (feedback !== undefined) review.feedback = feedback;

  await review.save();
  res.status(200).json(new ApiResponse(200, { review }, "Review updated"));
});

// @desc    Get reviews for a submission
// @route   GET /api/reviews/submission/:submissionId
// @access  Organizer | Admin | Judge (own)
const getReviewsBySubmission = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ submission: req.params.submissionId })
    .populate("judge", "name avatar email")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, { reviews }, "Reviews fetched"));
});

// @desc    Get all reviews by judge
// @route   GET /api/reviews/judge/:judgeId
// @access  Admin | Judge (own)
const getReviewsByJudge = asyncHandler(async (req, res) => {
  if (
    req.user.role !== "admin" &&
    req.user._id.toString() !== req.params.judgeId
  ) {
    throw new ApiError(403, "Not authorized");
  }

  const reviews = await Review.find({ judge: req.params.judgeId })
    .populate({ path: "submission", populate: { path: "team", select: "name" } })
    .populate("hackathon", "title")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, { reviews }, "Reviews fetched"));
});

// @desc    Get current judge's own reviews
// @route   GET /api/reviews/my
// @access  Judge
const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ judge: req.user._id })
    .populate({ path: "submission", select: "projectName team", populate: { path: "team", select: "name" } })
    .populate("hackathon", "title")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, { reviews }, "Your reviews fetched"));
});

// @desc    Get judge's pending & completed reviews for a hackathon
// @route   GET /api/reviews/hackathon/:hackathonId/judge
// @access  Judge
const getJudgeDashboard = asyncHandler(async (req, res) => {
  const hackathon = await Hackathon.findById(req.params.hackathonId);
  if (!hackathon) throw new ApiError(404, "Hackathon not found");

  const Submission = require("../models/Submission");

  // Get all submissions for this hackathon
  const allSubmissions = await Submission.find({ hackathon: req.params.hackathonId })
    .populate("team", "name")
    .populate("assignedJudges", "name email");

  // Filter submissions assigned specifically to this judge (or unassigned = any judge can review)
  const judgeIdStr = req.user._id.toString();
  const assignedSubmissions = allSubmissions.filter(s => {
    if (!s.assignedJudges || s.assignedJudges.length === 0) return true;
    return s.assignedJudges.some(j => (j._id || j).toString() === judgeIdStr);
  });

  // Get this judge's reviews
  const myReviews = await Review.find({
    hackathon: req.params.hackathonId,
    judge: req.user._id,
  });

  const reviewedSubmissionIds = new Set(myReviews.map(r => r.submission.toString()));

  const pending = assignedSubmissions.filter(s => !reviewedSubmissionIds.has(s._id.toString()));
  const completed = myReviews;

  res.status(200).json(
    new ApiResponse(200, {
      hackathon: { _id: hackathon._id, title: hackathon.title, judgingCriteria: hackathon.judgingCriteria },
      pending,
      completed,
    }, "Judge dashboard data fetched")
  );
});

module.exports = {
  submitReview,
  updateReview,
  getReviewsBySubmission,
  getReviewsByJudge,
  getJudgeDashboard,
  getMyReviews,
};
