const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // Also check cookie
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new ApiError(401, "Not authorized, no token provided");
  }

  const secret = process.env.JWT_SECRET || "hacklytics_dev_secret_key_12345";
  const decoded = jwt.verify(token, secret);
  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  if (user.isBlocked) {
    throw new ApiError(403, "Your account has been blocked. Contact admin.");
  }

  req.user = user;
  next();
});

module.exports = { protect };
