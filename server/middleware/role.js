const ApiError = require("../utils/ApiError");

/**
 * Role-based access control middleware.
 * Usage: authorizeRoles("admin", "organizer")
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Role '${req.user.role}' is not allowed to access this resource`
      );
    }
    if ((req.user.role === "organizer" || req.user.role === "judge") && !req.user.isApproved) {
      throw new ApiError(
        403,
        "Your account is pending admin approval. You cannot perform organizer or judge actions until approved by an admin."
      );
    }
    next();
  };
};

module.exports = { authorizeRoles };
