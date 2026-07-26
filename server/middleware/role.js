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
    next();
  };
};

module.exports = { authorizeRoles };
