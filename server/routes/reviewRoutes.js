const express = require("express");
const router = express.Router();
const {
  submitReview, updateReview, getReviewsBySubmission, getReviewsByJudge, getJudgeDashboard, getMyReviews,
} = require("../controllers/reviewController");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/role");

router.use(protect);

router.post("/", authorizeRoles("judge", "admin"), submitReview);
router.put("/:id", authorizeRoles("judge"), updateReview);
router.get("/my", authorizeRoles("judge"), getMyReviews);
router.get("/submission/:submissionId", authorizeRoles("organizer", "judge", "admin"), getReviewsBySubmission);
router.get("/judge/:judgeId", authorizeRoles("judge", "admin"), getReviewsByJudge);
router.get("/hackathon/:hackathonId/judge", authorizeRoles("judge"), getJudgeDashboard);

module.exports = router;
