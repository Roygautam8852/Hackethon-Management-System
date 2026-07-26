const express = require("express");
const router = express.Router();
const {
  getHackathons, getHackathonById, createHackathon, updateHackathon,
  deleteHackathon, toggleRegistration, assignJudge, removeJudge,
  publishResults, getMyHackathons, getAllHackathonsAdmin, findJudgeByEmail, getAllJudges,
  getMyAssignedHackathons,
} = require("../controllers/hackathonController");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/role");
const { uploadBanner } = require("../middleware/upload");

// Public
router.get("/", getHackathons);

// Protected — specific routes BEFORE wildcard /:id
router.get("/organizer/my", protect, authorizeRoles("organizer"), getMyHackathons);
router.get("/admin/all", protect, authorizeRoles("admin"), getAllHackathonsAdmin);
router.get("/judge/assigned", protect, authorizeRoles("judge", "admin"), getMyAssignedHackathons);
router.get("/find-judge", protect, authorizeRoles("organizer", "admin"), findJudgeByEmail);
router.get("/judges/all", protect, authorizeRoles("organizer", "admin"), getAllJudges);

router.get("/:id", getHackathonById);

router.post(
  "/",
  protect,
  authorizeRoles("organizer", "admin"),
  uploadBanner.single("bannerImage"),
  createHackathon
);

router.put(
  "/:id",
  protect,
  authorizeRoles("organizer", "admin"),
  uploadBanner.single("bannerImage"),
  updateHackathon
);

router.delete("/:id", protect, authorizeRoles("organizer", "admin"), deleteHackathon);

router.patch("/:id/registration", protect, authorizeRoles("organizer"), toggleRegistration);

router.post("/:id/assign-judge", protect, authorizeRoles("organizer", "admin"), assignJudge);
router.delete("/:id/assign-judge/:judgeId", protect, authorizeRoles("organizer", "admin"), removeJudge);

router.patch("/:id/publish-results", protect, authorizeRoles("organizer"), publishResults);

module.exports = router;
