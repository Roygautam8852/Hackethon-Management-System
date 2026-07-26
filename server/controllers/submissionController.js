const asyncHandler = require("express-async-handler");
const Submission = require("../models/Submission");
const Team = require("../models/Team");
const Hackathon = require("../models/Hackathon");
const Registration = require("../models/Registration");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const cloudinary = require("../config/cloudinary");

// @desc    Create submission
// @route   POST /api/submissions
// @access  Participant (team leader)
const createSubmission = asyncHandler(async (req, res) => {
  const {
    teamId, hackathonId, projectName, problemStatement,
    solutionDescription, githubRepo, liveDemoUrl, demoVideoLink, techStack,
  } = req.body;

  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) throw new ApiError(404, "Hackathon not found");

  if (new Date() > hackathon.endDate) {
    throw new ApiError(400, "Submission deadline has passed");
  }

  const team = await Team.findById(teamId);
  if (!team) throw new ApiError(404, "Team not found");

  if (team.leader.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only team leader can submit the project");
  }

  // Team must be approved
  const registration = await Registration.findOne({ team: teamId, hackathon: hackathonId, status: "approved" });
  if (!registration) {
    throw new ApiError(400, "Your team registration must be approved before submitting");
  }

  const existing = await Submission.findOne({ team: teamId, hackathon: hackathonId });
  if (existing) throw new ApiError(409, "Submission already exists. Use update instead.");

  // Handle file uploads
  const screenshots = req.files?.screenshots
    ? req.files.screenshots.map(f => ({ url: f.path, publicId: f.filename }))
    : [];

  const presentationPdf = req.files?.pdf?.[0]
    ? { url: req.files.pdf[0].path, publicId: req.files.pdf[0].filename }
    : { url: "", publicId: "" };

  const submission = await Submission.create({
    team: teamId,
    hackathon: hackathonId,
    submittedBy: req.user._id,
    projectName,
    problemStatement,
    solutionDescription,
    githubRepo,
    liveDemoUrl,
    demoVideoLink,
    techStack: techStack
      ? Array.isArray(techStack) ? techStack : techStack.split(",").map(s => s.trim())
      : [],
    screenshots,
    presentationPdf,
  });

  await submission.populate([
    { path: "team", select: "name" },
    { path: "hackathon", select: "title" },
  ]);

  res.status(201).json(new ApiResponse(201, { submission }, "Submission created successfully"));
});

// @desc    Update submission (before deadline)
// @route   PUT /api/submissions/:id
// @access  Participant (team leader)
const updateSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id).populate("hackathon", "endDate");
  if (!submission) throw new ApiError(404, "Submission not found");

  if (submission.submittedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to edit this submission");
  }

  if (new Date() > submission.hackathon.endDate) {
    throw new ApiError(400, "Cannot edit submission after deadline");
  }

  const updateFields = [
    "projectName", "problemStatement", "solutionDescription",
    "githubRepo", "liveDemoUrl", "demoVideoLink",
  ];

  updateFields.forEach(f => {
    if (req.body[f] !== undefined) submission[f] = req.body[f];
  });

  if (req.body.techStack) {
    submission.techStack = Array.isArray(req.body.techStack)
      ? req.body.techStack
      : req.body.techStack.split(",").map(s => s.trim());
  }

  // New screenshots
  if (req.files?.screenshots) {
    // Delete old screenshots from cloudinary
    for (const sc of submission.screenshots) {
      if (sc.publicId) await cloudinary.uploader.destroy(sc.publicId);
    }
    submission.screenshots = req.files.screenshots.map(f => ({ url: f.path, publicId: f.filename }));
  }

  if (req.files?.pdf?.[0]) {
    if (submission.presentationPdf?.publicId) {
      await cloudinary.uploader.destroy(submission.presentationPdf.publicId, { resource_type: "raw" });
    }
    submission.presentationPdf = {
      url: req.files.pdf[0].path,
      publicId: req.files.pdf[0].filename,
    };
  }

  await submission.save();
  res.status(200).json(new ApiResponse(200, { submission }, "Submission updated"));
});

// @desc    Get submissions for a hackathon
// @route   GET /api/submissions/hackathon/:hackathonId
// @access  Organizer | Judge | Admin
const getSubmissionsByHackathon = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = { hackathon: req.params.hackathonId };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [submissions, total] = await Promise.all([
    Submission.find(query)
      .populate("team", "name leader")
      .populate("submittedBy", "name avatar")
      .populate("assignedJudges", "name email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Submission.countDocuments(query),
  ]);

  res.status(200).json(
    new ApiResponse(200, { submissions, total, page: Number(page) }, "Submissions fetched")
  );
});

// @desc    Get single submission
// @route   GET /api/submissions/:id
// @access  Auth
const getSubmissionById = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id)
    .populate("team", "name members leader")
    .populate("submittedBy", "name avatar email")
    .populate("assignedJudges", "name avatar email")
    .populate("hackathon", "title judgingCriteria endDate");

  if (!submission) throw new ApiError(404, "Submission not found");

  res.status(200).json(new ApiResponse(200, { submission }, "Submission fetched"));
});

// @desc    Get my team's submission
// @route   GET /api/submissions/my/:hackathonId
// @access  Participant
const getMySubmission = asyncHandler(async (req, res) => {
  // Find user's team in this hackathon
  const team = await Team.findOne({
    hackathon: req.params.hackathonId,
    $or: [
      { leader: req.user._id },
      { "members.user": req.user._id, "members.status": "accepted" },
    ],
  });

  if (!team) {
    return res.status(200).json(new ApiResponse(200, { submission: null }, "No submission found"));
  }

  const submission = await Submission.findOne({ team: team._id, hackathon: req.params.hackathonId })
    .populate("team", "name")
    .populate("hackathon", "title endDate");

  res.status(200).json(new ApiResponse(200, { submission: submission || null }, "Submission fetched"));
});

// @desc    Update submission status (organizer)
// @route   PATCH /api/submissions/:id/status
// @access  Organizer
const updateSubmissionStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const submission = await Submission.findById(req.params.id).populate("hackathon", "organizer");
  if (!submission) throw new ApiError(404, "Submission not found");

  if (submission.hackathon.organizer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  submission.status = status;
  await submission.save();

  res.status(200).json(new ApiResponse(200, { submission }, "Status updated"));
});

// @desc    Assign judges to a specific submission (organizer/admin)
// @route   PATCH /api/submissions/:id/assign-judges
// @access  Organizer | Admin
const assignJudgesToSubmission = asyncHandler(async (req, res) => {
  const { judgeIds } = req.body;
  const submission = await Submission.findById(req.params.id).populate("hackathon", "organizer");
  if (!submission) throw new ApiError(404, "Submission not found");

  if (req.user.role !== "admin" && submission.hackathon.organizer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to assign judges for this submission");
  }

  submission.assignedJudges = Array.isArray(judgeIds) ? judgeIds : [];
  await submission.save();
  await submission.populate("assignedJudges", "name email avatar");

  res.status(200).json(new ApiResponse(200, { submission }, "Judges assigned to submission"));
});

module.exports = {
  createSubmission,
  updateSubmission,
  getSubmissionsByHackathon,
  getSubmissionById,
  getMySubmission,
  updateSubmissionStatus,
  assignJudgesToSubmission,
};
