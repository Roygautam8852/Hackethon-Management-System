const express = require("express");
const router = express.Router();
const {
  registerTeam, getRegistrationsByHackathon, approveRegistration,
  rejectRegistration, cancelRegistration, getMyRegistrations,
} = require("../controllers/registrationController");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/role");

router.use(protect);

router.post("/", authorizeRoles("participant"), registerTeam);
router.get("/my", authorizeRoles("participant"), getMyRegistrations);
router.get("/hackathon/:hackathonId", authorizeRoles("organizer", "admin"), getRegistrationsByHackathon);
router.patch("/:id/approve", authorizeRoles("organizer", "admin"), approveRegistration);
router.patch("/:id/reject", authorizeRoles("organizer", "admin"), rejectRegistration);
router.delete("/:id", authorizeRoles("participant"), cancelRegistration);

module.exports = router;
