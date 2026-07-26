const express = require("express");
const router = express.Router();
const {
  createSubmission, updateSubmission, getSubmissionsByHackathon,
  getSubmissionById, getMySubmission, updateSubmissionStatus, assignJudgesToSubmission,
} = require("../controllers/submissionController");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/role");
const { uploadScreenshots, uploadPdf } = require("../middleware/upload");
const multer = require("multer");

router.use(protect);

// Multi-field upload: screenshots[] + pdf
const submissionUpload = multer({
  storage: require("../middleware/upload").uploadScreenshots.storage,
}).fields([
  { name: "screenshots", maxCount: 5 },
  { name: "pdf", maxCount: 1 },
]);

router.post("/", authorizeRoles("participant"), createSubmission);
router.put("/:id", authorizeRoles("participant"), updateSubmission);
router.get("/my/:hackathonId", authorizeRoles("participant"), getMySubmission);
router.get("/hackathon/:hackathonId", authorizeRoles("organizer", "judge", "admin"), getSubmissionsByHackathon);
router.get("/:id", getSubmissionById);
router.patch("/:id/status", authorizeRoles("organizer", "admin"), updateSubmissionStatus);
router.patch("/:id/assign-judges", authorizeRoles("organizer", "admin"), assignJudgesToSubmission);

module.exports = router;
