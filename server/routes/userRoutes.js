const express = require("express");
const router = express.Router();
const {
  getAllUsers, getUserById, updateUser, deleteUser, toggleBlockUser, toggleApproveUser, getAnalytics,
} = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/role");

router.use(protect);
router.use(authorizeRoles("admin"));

router.get("/analytics", getAnalytics);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.patch("/:id/block", toggleBlockUser);
router.patch("/:id/approve", toggleApproveUser);

module.exports = router;
