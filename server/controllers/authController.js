const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const generateToken = require("../utils/generateToken");

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  // Only allow participant/organizer/judge on public signup
  const allowedRoles = ["participant", "organizer", "judge"];
  const userRole = allowedRoles.includes(role) ? role : "participant";
  const isApproved = userRole === "participant" || userRole === "admin";

  const user = await User.create({ name, email, password, role: userRole, isApproved });
  const token = generateToken(user._id);

  res.cookie("token", token, cookieOptions);

  res.status(201).json(
    new ApiResponse(201, { user, token }, "Account created successfully")
  );
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.isBlocked) {
    throw new ApiError(403, "Your account has been blocked. Contact admin.");
  }

  const token = generateToken(user._id);
  res.cookie("token", token, cookieOptions);

  // Return user without password
  const userObj = user.toJSON();

  res.status(200).json(
    new ApiResponse(200, { user: userObj, token }, "Login successful")
  );
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  res.status(200).json(new ApiResponse(200, { user }, "User fetched successfully"));
});

// @desc    Update profile
// @route   PUT /api/auth/update-profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, skills, github, linkedin, portfolio } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  if (name) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (skills) user.skills = Array.isArray(skills) ? skills : skills.split(",").map(s => s.trim());
  if (github !== undefined) user.github = github;
  if (linkedin !== undefined) user.linkedin = linkedin;
  if (portfolio !== undefined) user.portfolio = portfolio;

  // Handle avatar upload
  if (req.file) {
    // Delete old avatar from cloudinary if exists
    if (user.avatarPublicId) {
      const cloudinary = require("../config/cloudinary");
      await cloudinary.uploader.destroy(user.avatarPublicId);
    }
    user.avatar = req.file.path;
    user.avatarPublicId = req.file.filename;
  }

  await user.save();
  res.status(200).json(new ApiResponse(200, { user }, "Profile updated successfully"));
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current and new password are required");
  }

  const user = await User.findById(req.user._id).select("+password");
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    throw new ApiError(400, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json(new ApiResponse(200, null, "Password changed successfully"));
});

module.exports = { signup, login, logout, getMe, updateProfile, changePassword };
