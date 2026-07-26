const express = require("express");
const router = express.Router();
const {
  signup, login, logout, getMe, updateProfile, changePassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { uploadAvatar } = require("../middleware/upload");

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.put("/update-profile", protect, uploadAvatar.single("avatar"), updateProfile);
router.put("/change-password", protect, changePassword);

module.exports = router;
