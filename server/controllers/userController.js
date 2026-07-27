const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// @desc    Get all users (with search + filter)
// @route   GET /api/users
// @access  Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const { search, role, isBlocked, isApproved, page = 1, limit = 20 } = req.query;

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  if (role) query.role = role;
  if (isBlocked !== undefined) query.isBlocked = isBlocked === "true";
  if (isApproved !== undefined) {
    if (isApproved === "true") {
      query.isApproved = { $ne: false };
    } else if (isApproved === "false") {
      query.isApproved = false;
    }
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(query),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      users,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    }, "Users fetched successfully")
  );
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json(new ApiResponse(200, { user }, "User fetched"));
});

// @desc    Update user (Admin)
// @route   PUT /api/users/:id
// @access  Admin
const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;

  await user.save();
  res.status(200).json(new ApiResponse(200, { user }, "User updated"));
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  // Prevent deleting another admin
  if (user.role === "admin" && req.user._id.toString() !== user._id.toString()) {
    throw new ApiError(403, "Cannot delete another admin");
  }

  await user.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
});

// @desc    Block / Unblock user
// @route   PATCH /api/users/:id/block
// @access  Admin
const toggleBlockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  if (user.role === "admin") {
    throw new ApiError(403, "Cannot block an admin account");
  }

  user.isBlocked = !user.isBlocked;
  await user.save();

  const action = user.isBlocked ? "blocked" : "unblocked";
  res.status(200).json(
    new ApiResponse(200, { user }, `User has been ${action}`)
  );
});

// @desc    Approve / Revoke user approval (Organizer / Judge)
// @route   PATCH /api/users/:id/approve
// @access  Admin
const toggleApproveUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  user.isApproved = !user.isApproved;
  await user.save();

  const action = user.isApproved ? "approved" : "unapproved";
  res.status(200).json(
    new ApiResponse(200, { user }, `User has been ${action}`)
  );
});

// @desc    Platform analytics (Admin)
// @route   GET /api/users/analytics
// @access  Admin
const getAnalytics = asyncHandler(async (req, res) => {
  const Hackathon = require("../models/Hackathon");
  const Team = require("../models/Team");
  const Submission = require("../models/Submission");
  const Registration = require("../models/Registration");

  const [
    totalUsers,
    totalHackathons,
    totalTeams,
    totalSubmissions,
    totalRegistrations,
    usersByRole,
    hackathonsByStatus,
    recentUsers,
    registrationsByStatus,
    pendingApprovals,
  ] = await Promise.all([
    User.countDocuments(),
    Hackathon.countDocuments(),
    Team.countDocuments(),
    Submission.countDocuments(),
    Registration.countDocuments(),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    Hackathon.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    User.find().sort({ createdAt: -1 }).limit(5).select("name email role avatar createdAt"),
    Registration.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    User.countDocuments({ role: { $in: ["organizer", "judge"] }, isApproved: false }),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      totalUsers,
      totalHackathons,
      totalTeams,
      totalSubmissions,
      totalRegistrations,
      usersByRole,
      hackathonsByStatus,
      registrationsByStatus,
      recentUsers,
      pendingApprovals,
    }, "Analytics fetched")
  );
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleBlockUser,
  toggleApproveUser,
  getAnalytics,
};
