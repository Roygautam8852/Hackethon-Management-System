const asyncHandler = require("express-async-handler");
const Hackathon = require("../models/Hackathon");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const cloudinary = require("../config/cloudinary");

// @desc    Get all hackathons (public, with search & filters)
// @route   GET /api/hackathons
// @access  Public
const getHackathons = asyncHandler(async (req, res) => {
  const {
    search, mode, status, theme, registrationOpen,
    page = 1, limit = 12, sort = "-createdAt",
  } = req.query;

  const query = { status: { $ne: "draft" } };

  if (search) {
    query.$text = { $search: search };
  }
  if (mode) query.mode = mode;
  if (status) query.status = status;
  if (theme) query.theme = { $regex: theme, $options: "i" };
  if (registrationOpen !== undefined) query.registrationOpen = registrationOpen === "true";

  const skip = (Number(page) - 1) * Number(limit);

  const [hackathons, total] = await Promise.all([
    Hackathon.find(query)
      .populate("organizer", "name avatar email")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    Hackathon.countDocuments(query),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      hackathons,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    }, "Hackathons fetched")
  );
});

// @desc    Get single hackathon
// @route   GET /api/hackathons/:id
// @access  Public
const getHackathonById = asyncHandler(async (req, res) => {
  const hackathon = await Hackathon.findById(req.params.id)
    .populate("organizer", "name avatar email bio")
    .populate("assignedJudges", "name avatar email");

  if (!hackathon) throw new ApiError(404, "Hackathon not found");

  res.status(200).json(new ApiResponse(200, { hackathon }, "Hackathon fetched"));
});

// Helper to safely parse JSON strings or return fallback
const safeJSONParse = (val, fallback) => {
  if (!val) return fallback;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch (_) {
    return fallback;
  }
};

// @desc    Create hackathon
// @route   POST /api/hackathons
// @access  Organizer
const createHackathon = asyncHandler(async (req, res) => {
  const {
    title, description, theme, mode, venue, startDate, endDate,
    registrationDeadline, prizePool, maxTeamSize, minTeamSize,
    rules, judgingCriteria, tags, website, contactEmail, isPublished, status,
  } = req.body;

  const publishedBool = isPublished === "true" || isPublished === true;
  const initialStatus = status || (publishedBool ? "registration_open" : "draft");

  const parsedRules = safeJSONParse(rules, []);
  const parsedCriteria = safeJSONParse(judgingCriteria, []);
  const parsedTags = typeof tags === "string"
    ? tags.split(",").map(t => t.trim()).filter(Boolean)
    : (Array.isArray(tags) ? tags : []);

  // Determine banner: compressed base64 from client (preferred) or Cloudinary file
  let bannerImage = "";
  let bannerImagePublicId = "";

  if (req.body.bannerBase64) {
    const b64 = req.body.bannerBase64;
    if (b64.startsWith("data:image/") && b64.length <= 500 * 1024) {
      bannerImage = b64;
    }
  } else if (req.file && req.file.path) {
    bannerImage = req.file.path;
    bannerImagePublicId = req.file.filename || "";
  }

  const hackathon = await Hackathon.create({
    title,
    description,
    theme,
    mode: mode || "online",
    venue: venue || "",
    startDate: startDate ? new Date(startDate) : new Date(),
    endDate: endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : new Date(),
    prizePool: prizePool || "",
    maxTeamSize: maxTeamSize ? Number(maxTeamSize) : 4,
    minTeamSize: minTeamSize ? Number(minTeamSize) : 1,
    rules: parsedRules,
    judgingCriteria: parsedCriteria,
    tags: parsedTags,
    website: website || "",
    contactEmail: contactEmail || "",
    organizer: req.user._id,
    bannerImage,
    bannerImagePublicId,
    isPublished: publishedBool,
    status: initialStatus,
    registrationOpen: publishedBool || initialStatus === "registration_open",
  });

  await hackathon.populate("organizer", "name avatar email");

  res.status(201).json(
    new ApiResponse(201, { hackathon }, "Hackathon created successfully")
  );
});

// @desc    Update hackathon
// @route   PUT /api/hackathons/:id
// @access  Organizer (own) | Admin
const updateHackathon = asyncHandler(async (req, res) => {
  const hackathon = await Hackathon.findById(req.params.id);
  if (!hackathon) throw new ApiError(404, "Hackathon not found");

  // Organizer can only edit their own
  if (
    req.user.role === "organizer" &&
    hackathon.organizer.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "Not authorized to edit this hackathon");
  }

  const updateFields = [
    "title", "description", "theme", "mode", "venue",
    "startDate", "endDate", "registrationDeadline", "prizePool",
    "maxTeamSize", "minTeamSize", "rules", "judgingCriteria",
    "tags", "website", "contactEmail", "status", "isPublished", "registrationOpen",
  ];

  updateFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (["rules", "judgingCriteria"].includes(field) && typeof req.body[field] === "string") {
        hackathon[field] = safeJSONParse(req.body[field], hackathon[field]);
      } else {
        hackathon[field] = req.body[field];
      }
    }
  });

  // Update banner
  if (req.file) {
    if (hackathon.bannerImagePublicId) {
      try { await cloudinary.uploader.destroy(hackathon.bannerImagePublicId); } catch (_) {}
    }
    hackathon.bannerImage = req.file.path || "";
    hackathon.bannerImagePublicId = req.file.filename || "";
  }

  await hackathon.save();
  await hackathon.populate("organizer", "name avatar email");

  res.status(200).json(new ApiResponse(200, { hackathon }, "Hackathon updated"));
});

// @desc    Delete hackathon
// @route   DELETE /api/hackathons/:id
// @access  Organizer (own) | Admin
const deleteHackathon = asyncHandler(async (req, res) => {
  const hackathon = await Hackathon.findById(req.params.id);
  if (!hackathon) throw new ApiError(404, "Hackathon not found");

  if (
    req.user.role === "organizer" &&
    hackathon.organizer.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "Not authorized to delete this hackathon");
  }

  const id = req.params.id;

  // Delete banner from cloudinary safely
  if (hackathon.bannerImagePublicId) {
    try { await cloudinary.uploader.destroy(hackathon.bannerImagePublicId); } catch (_) {}
  }

  // Cascade delete all associated data (registrations, teams, submissions, reviews)
  const Registration = require("../models/Registration");
  const Team = require("../models/Team");
  const Submission = require("../models/Submission");
  const Review = require("../models/Review");

  await Promise.all([
    Registration.deleteMany({ hackathon: id }),
    Team.deleteMany({ hackathon: id }),
    Submission.deleteMany({ hackathon: id }),
    Review.deleteMany({ hackathon: id }),
  ]);

  await hackathon.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Hackathon and all associated data deleted successfully"));
});

// @desc    Toggle registration open/close
// @route   PATCH /api/hackathons/:id/registration
// @access  Organizer (own)
const toggleRegistration = asyncHandler(async (req, res) => {
  const hackathon = await Hackathon.findById(req.params.id);
  if (!hackathon) throw new ApiError(404, "Hackathon not found");

  if (hackathon.organizer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  hackathon.registrationOpen = !hackathon.registrationOpen;
  if (hackathon.registrationOpen) {
    hackathon.status = "registration_open";
  } else {
    hackathon.status = "registration_closed";
  }

  await hackathon.save();
  const action = hackathon.registrationOpen ? "opened" : "closed";
  res.status(200).json(new ApiResponse(200, { hackathon }, `Registration ${action}`));
});

// @desc    Assign judge to hackathon
// @route   POST /api/hackathons/:id/assign-judge
// @access  Organizer (own)
const assignJudge = asyncHandler(async (req, res) => {
  const { judgeId } = req.body;

  const hackathon = await Hackathon.findById(req.params.id);
  if (!hackathon) throw new ApiError(404, "Hackathon not found");

  if (hackathon.organizer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw new ApiError(403, "Not authorized");
  }

  const judge = await User.findById(judgeId);
  if (!judge || judge.role !== "judge" || judge.isApproved === false || judge.isBlocked) {
    throw new ApiError(400, "Judge is not valid or pending admin approval");
  }

  if (hackathon.assignedJudges.includes(judgeId)) {
    throw new ApiError(409, "Judge already assigned");
  }

  hackathon.assignedJudges.push(judgeId);
  await hackathon.save();
  await hackathon.populate("assignedJudges", "name avatar email");

  res.status(200).json(new ApiResponse(200, { hackathon }, "Judge assigned"));
});

// @desc    Remove judge from hackathon
// @route   DELETE /api/hackathons/:id/assign-judge/:judgeId
// @access  Organizer (own)
const removeJudge = asyncHandler(async (req, res) => {
  const hackathon = await Hackathon.findById(req.params.id);
  if (!hackathon) throw new ApiError(404, "Hackathon not found");

  if (hackathon.organizer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw new ApiError(403, "Not authorized");
  }

  hackathon.assignedJudges = hackathon.assignedJudges.filter(
    (j) => j.toString() !== req.params.judgeId
  );
  await hackathon.save();

  res.status(200).json(new ApiResponse(200, null, "Judge removed"));
});

// @desc    Publish results / Announce winners
// @desc    Publish results / Announce winners
// @route   PATCH /api/hackathons/:id/publish-results
// @access  Organizer (own)
const publishResults = asyncHandler(async (req, res) => {
  const { winners } = req.body;
  const hackathon = await Hackathon.findById(req.params.id);
  if (!hackathon) throw new ApiError(404, "Hackathon not found");

  if (hackathon.organizer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw new ApiError(403, "Not authorized");
  }

  // Check if hackathon end date has passed
  const now = new Date();
  if (hackathon.endDate && now < new Date(hackathon.endDate) && req.user.role !== "admin") {
    const endDateStr = new Date(hackathon.endDate).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
    throw new ApiError(400, `Cannot publish results before the hackathon end date (${endDateStr})`);
  }

  if (winners) hackathon.winners = winners;
  hackathon.status = "completed";
  await hackathon.save();

  res.status(200).json(new ApiResponse(200, { hackathon }, "Results published"));
});

// @desc    Get organizer's hackathons
// @route   GET /api/hackathons/organizer/my
// @access  Organizer
const getMyHackathons = asyncHandler(async (req, res) => {
  const hackathons = await Hackathon.find({ organizer: req.user._id })
    .populate("organizer", "name avatar email")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, { hackathons }, "Your hackathons fetched"));
});

// @desc    Get ALL hackathons including drafts (Admin only)
// @route   GET /api/hackathons/admin/all
// @access  Admin
const getAllHackathonsAdmin = asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 20, sort = "-createdAt" } = req.query;

  const query = {};
  if (search) query.$or = [
    { title: { $regex: search, $options: "i" } },
    { theme: { $regex: search, $options: "i" } },
  ];
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [hackathons, total] = await Promise.all([
    Hackathon.find(query)
      .populate("organizer", "name avatar email")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    Hackathon.countDocuments(query),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      hackathons,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    }, "All hackathons fetched (admin)")
  );
});

// @desc    Find a judge user by email (for organizer assign-judge flow)
// @route   GET /api/hackathons/find-judge?email=xxx
// @access  Organizer
const findJudgeByEmail = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    role: "judge",
    isApproved: { $ne: false },
    isBlocked: false,
  }).select("name email avatar role");
  if (!user) throw new ApiError(404, "No approved judge found with this email");

  res.status(200).json(new ApiResponse(200, { user }, "Judge found"));
});

// @desc    Get all registered judges in the system
// @route   GET /api/hackathons/judges/all
// @access  Organizer | Admin
const getAllJudges = asyncHandler(async (req, res) => {
  const judges = await User.find({ role: "judge", isApproved: { $ne: false }, isBlocked: false })
    .select("name email avatar bio skills createdAt")
    .sort({ name: 1 });

  res.status(200).json(new ApiResponse(200, { judges }, "All judges fetched successfully"));
});

// @desc    Get hackathons assigned to current judge (globally or via submission assignment)
// @route   GET /api/hackathons/judge/assigned
// @access  Judge
const getMyAssignedHackathons = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const Submission = require("../models/Submission");

  // 1. Hackathons assigned at global hackathon level
  const globalHackathons = await Hackathon.find({ assignedJudges: userId })
    .populate("organizer", "name avatar email");

  // 2. Hackathons assigned at individual submission level
  const submissionsWithJudge = await Submission.find({ assignedJudges: userId }).select("hackathon");
  const subHackathonIds = submissionsWithJudge.map(s => s.hackathon);

  const subHackathons = await Hackathon.find({ _id: { $in: subHackathonIds } })
    .populate("organizer", "name avatar email");

  // Combine and deduplicate by _id
  const map = new Map();
  [...globalHackathons, ...subHackathons].forEach(h => map.set(h._id.toString(), h));
  const hackathons = Array.from(map.values());

  res.status(200).json(new ApiResponse(200, { hackathons }, "Assigned hackathons fetched for judge"));
});

module.exports = {
  getHackathons,
  getHackathonById,
  createHackathon,
  updateHackathon,
  deleteHackathon,
  toggleRegistration,
  assignJudge,
  removeJudge,
  publishResults,
  getMyHackathons,
  getAllHackathonsAdmin,
  findJudgeByEmail,
  getAllJudges,
  getMyAssignedHackathons,
};
