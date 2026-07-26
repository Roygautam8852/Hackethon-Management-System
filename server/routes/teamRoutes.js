const express = require("express");
const router = express.Router();
const {
  createTeam, getTeamsByHackathon, getTeamById, updateTeam,
  inviteMember, respondToInvitation, removeMember, transferLeader,
  leaveTeam, deleteTeam, getMyTeam, getMyPendingInvitations, getAllTeams,
} = require("../controllers/teamController");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/role");

router.use(protect);

router.post("/", authorizeRoles("participant"), createTeam);
router.get("/admin/all", authorizeRoles("admin"), getAllTeams);
router.get("/hackathon/:hackathonId", getTeamsByHackathon);
router.get("/my/:hackathonId", authorizeRoles("participant"), getMyTeam);
router.get("/invitations/pending", authorizeRoles("participant"), getMyPendingInvitations);
router.get("/:id", getTeamById);
router.put("/:id", authorizeRoles("participant"), updateTeam);
router.post("/:id/invite", authorizeRoles("participant"), inviteMember);
router.patch("/:id/invitation", authorizeRoles("participant"), respondToInvitation);
router.delete("/:id/members/:userId", authorizeRoles("participant"), removeMember);
router.patch("/:id/transfer-leader", authorizeRoles("participant"), transferLeader);
router.delete("/:id/leave", authorizeRoles("participant"), leaveTeam);
router.delete("/:id", authorizeRoles("participant", "admin"), deleteTeam);

module.exports = router;
