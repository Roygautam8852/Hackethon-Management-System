const asyncHandler = require("express-async-handler");
const Team = require("../models/Team");
const User = require("../models/User");
const Hackathon = require("../models/Hackathon");
const Registration = require("../models/Registration");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// @desc    Create team
// @route   POST /api/teams
// @access  Participant
const createTeam = asyncHandler(async (req, res) => {
  const { name, hackathonId, description, techStack } = req.body;

  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) throw new ApiError(404, "Hackathon not found");

  if (!hackathon.registrationOpen) {
    throw new ApiError(400, "Registration is not open for this hackathon");
  }

  // Check if user already has a team in this hackathon
  const existingTeam = await Team.findOne({
    hackathon: hackathonId,
    $or: [
      { leader: req.user._id },
      { "members.user": req.user._id },
    ],
  });

  if (existingTeam) {
    throw new ApiError(409, "You already belong to a team in this hackathon");
  }

  const team = await Team.create({
    name,
    hackathon: hackathonId,
    leader: req.user._id,
    members: [{ user: req.user._id, status: "accepted" }],
    status: "registered",
    description,
    techStack: techStack
      ? Array.isArray(techStack) ? techStack : techStack.split(",").map(s => s.trim())
      : [],
  });

  // Automatically create Registration record for hackathon
  await Registration.create({
    hackathon: hackathonId,
    team: team._id,
    registeredBy: req.user._id,
    status: "pending",
  }).catch(() => {});

  await team.populate([
    { path: "leader", select: "name avatar email" },
    { path: "members.user", select: "name avatar email" },
    { path: "hackathon", select: "title" },
  ]);

  res.status(201).json(new ApiResponse(201, { team }, "Team created and registered successfully"));
});

// @desc    Get teams for a hackathon
// @route   GET /api/teams/hackathon/:hackathonId
// @access  Auth
const getTeamsByHackathon = asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;

  const query = { hackathon: req.params.hackathonId };
  if (status) query.status = status;
  if (search) query.name = { $regex: search, $options: "i" };

  const skip = (Number(page) - 1) * Number(limit);

  const [teams, total] = await Promise.all([
    Team.find(query)
      .populate("leader", "name avatar email")
      .populate("members.user", "name avatar email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Team.countDocuments(query),
  ]);

  res.status(200).json(
    new ApiResponse(200, { teams, total, page: Number(page), pages: Math.ceil(total / Number(limit)) }, "Teams fetched")
  );
});

// @desc    Get single team
// @route   GET /api/teams/:id
// @access  Auth
const getTeamById = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate("leader", "name avatar email bio")
    .populate("members.user", "name avatar email bio skills")
    .populate("hackathon", "title status");

  if (!team) throw new ApiError(404, "Team not found");

  res.status(200).json(new ApiResponse(200, { team }, "Team fetched"));
});

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Team Leader
const updateTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw new ApiError(404, "Team not found");

  if (team.leader.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only team leader can update team details");
  }

  const { name, description, techStack, lookingForMembers } = req.body;
  if (name) team.name = name;
  if (description !== undefined) team.description = description;
  if (techStack) team.techStack = Array.isArray(techStack) ? techStack : techStack.split(",").map(s => s.trim());
  if (lookingForMembers !== undefined) team.lookingForMembers = lookingForMembers;

  await team.save();
  await team.populate([
    { path: "leader", select: "name avatar email" },
    { path: "members.user", select: "name avatar email" },
  ]);

  res.status(200).json(new ApiResponse(200, { team }, "Team updated"));
});

// @desc    Add member to team with full details (Name and/or Email)
// @route   POST /api/teams/:id/invite
// @access  Team Leader
const inviteMember = asyncHandler(async (req, res) => {
  const { name, email, query, skills } = req.body;

  const inputEmail = (email || (query && query.includes("@") ? query : "")).trim();
  const inputName = (name || (query && !query.includes("@") ? query : "")).trim();

  if (!inputEmail && !inputName) {
    throw new ApiError(400, "Please enter teammate's name or email address");
  }

  const team = await Team.findById(req.params.id).populate("hackathon", "maxTeamSize");
  if (!team) throw new ApiError(404, "Team not found");

  if (team.leader.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only team leader can add members to the team");
  }

  const maxTeamSize = team.hackathon?.maxTeamSize || 10;
  if (team.members.length >= maxTeamSize) {
    throw new ApiError(400, `Team size cannot exceed maximum limit of ${maxTeamSize} members`);
  }

  let targetUser;

  // 1. Check if user already exists by email (if email provided)
  if (inputEmail) {
    targetUser = await User.findOne({ email: inputEmail.toLowerCase() });
  }

  // 2. Check if user exists by name (if name provided)
  if (!targetUser && inputName) {
    targetUser = await User.findOne({ name: { $regex: inputName, $options: "i" } });
  }

  // 3. If no user found, create user profile with entered details
  if (!targetUser) {
    const finalEmail = inputEmail 
      ? inputEmail.toLowerCase() 
      : `${inputName.toLowerCase().replace(/[^a-z0-9]/g, "")}@hacklytics.local`;

    const finalName = inputName 
      ? inputName 
      : inputEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());

    targetUser = await User.create({
      name: finalName,
      email: finalEmail,
      password: "DefaultPassword123!",
      role: "participant",
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(",").map(s => s.trim()) : []),
    });
  }

  // Prevent adding team leader
  if (targetUser._id.toString() === team.leader.toString()) {
    throw new ApiError(400, "You are already the leader of this team");
  }

  // Check if already in team
  const existingMemberIndex = team.members.findIndex(
    (m) => m.user.toString() === targetUser._id.toString()
  );

  if (existingMemberIndex !== -1) {
    if (team.members[existingMemberIndex].status === "accepted") {
      throw new ApiError(409, `${targetUser.name} (${targetUser.email}) is already a member of this team`);
    } else {
      team.members[existingMemberIndex].status = "accepted";
    }
  } else {
    // Add directly as accepted member
    team.members.push({ user: targetUser._id, status: "accepted" });
  }

  await team.save();
  await team.populate([
    { path: "leader", select: "name avatar email" },
    { path: "members.user", select: "name avatar email skills" },
  ]);

  res.status(200).json(new ApiResponse(200, { team }, `${targetUser.name} added to team successfully`));
});

// @desc    Accept / Reject invitation
// @route   PATCH /api/teams/:id/invitation
// @access  Participant (invited)
const respondToInvitation = asyncHandler(async (req, res) => {
  const { action } = req.body; // "accept" | "reject"

  const team = await Team.findById(req.params.id);
  if (!team) throw new ApiError(404, "Team not found");

  const memberEntry = team.members.find(
    m => m.user.toString() === req.user._id.toString()
  );
  if (!memberEntry) throw new ApiError(404, "You are not invited to this team");
  if (memberEntry.status !== "pending") {
    throw new ApiError(400, "Invitation already responded to");
  }

  memberEntry.status = action === "accept" ? "accepted" : "rejected";
  await team.save();

  res.status(200).json(
    new ApiResponse(200, { team }, `Invitation ${memberEntry.status}`)
  );
});

// @desc    Remove member from team
// @route   DELETE /api/teams/:id/members/:userId
// @access  Leader
const removeMember = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw new ApiError(404, "Team not found");

  if (team.leader.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only leader can remove members");
  }

  if (req.params.userId === req.user._id.toString()) {
    throw new ApiError(400, "Leader cannot remove themselves. Transfer leadership first.");
  }

  team.members = team.members.filter(
    m => m.user.toString() !== req.params.userId
  );

  await team.save();
  res.status(200).json(new ApiResponse(200, { team }, "Member removed"));
});

// @desc    Transfer leadership
// @route   PATCH /api/teams/:id/transfer-leader
// @access  Leader
const transferLeader = asyncHandler(async (req, res) => {
  const { newLeaderId } = req.body;
  const team = await Team.findById(req.params.id);
  if (!team) throw new ApiError(404, "Team not found");

  if (team.leader.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only current leader can transfer leadership");
  }

  const isMember = team.members.some(
    m => m.user.toString() === newLeaderId && m.status === "accepted"
  );
  if (!isMember) throw new ApiError(400, "New leader must be an accepted team member");

  team.leader = newLeaderId;
  await team.save();
  await team.populate("leader", "name avatar email");

  res.status(200).json(new ApiResponse(200, { team }, "Leadership transferred"));
});

// @desc    Leave team
// @route   DELETE /api/teams/:id/leave
// @access  Participant (non-leader member)
const leaveTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw new ApiError(404, "Team not found");

  if (team.leader.toString() === req.user._id.toString()) {
    throw new ApiError(400, "Leader must transfer leadership before leaving");
  }

  team.members = team.members.filter(
    m => m.user.toString() !== req.user._id.toString()
  );
  await team.save();

  res.status(200).json(new ApiResponse(200, null, "You have left the team"));
});

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Leader
const deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) throw new ApiError(404, "Team not found");

  if (team.leader.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw new ApiError(403, "Not authorized to delete this team");
  }

  await team.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Team deleted"));
});

// @desc    Get my pending team invitations (across all hackathons)
// @route   GET /api/teams/invitations/pending
// @access  Participant
const getMyPendingInvitations = asyncHandler(async (req, res) => {
  const teams = await Team.find({
    "members.user": req.user._id,
    "members.status": "pending",
  })
    .populate("leader", "name avatar email")
    .populate("members.user", "name avatar email")
    .populate("hackathon", "title status");

  res.status(200).json(new ApiResponse(200, { teams }, "Pending invitations fetched"));
});

// @desc    Get my team in a hackathon
// @route   GET /api/teams/my/:hackathonId
// @access  Participant
const getMyTeam = asyncHandler(async (req, res) => {
  let team = await Team.findOne({
    hackathon: req.params.hackathonId,
    $or: [
      { leader: req.user._id },
      { "members.user": req.user._id },
    ],
  })
    .populate("leader", "name avatar email")
    .populate("members.user", "name avatar email skills")
    .populate("hackathon", "title status maxTeamSize");

  if (!team) {
    return res.status(200).json(new ApiResponse(200, { team: null }, "No team found"));
  }

  // Ensure Registration record exists
  let registration = await Registration.findOne({ hackathon: req.params.hackathonId, team: team._id });
  if (!registration) {
    registration = await Registration.create({
      hackathon: req.params.hackathonId,
      team: team._id,
      registeredBy: team.leader._id || team.leader,
      status: "pending",
    }).catch(() => null);
  }

  let statusChanged = false;
  if (registration && registration.status === "approved" && team.status !== "approved") {
    team.status = "approved";
    statusChanged = true;
  } else if (registration && registration.status === "rejected" && team.status !== "rejected") {
    team.status = "rejected";
    statusChanged = true;
  } else if (team.status === "forming") {
    team.status = "registered";
    statusChanged = true;
  }

  // Auto-promote any pending members to accepted
  if (team.members.some(m => m.status === "pending")) {
    team.members.forEach(m => {
      if (m.status === "pending") m.status = "accepted";
    });
    statusChanged = true;
  }

  if (statusChanged) {
    await team.save();
  }

  res.status(200).json(new ApiResponse(200, { team }, "Team fetched"));
});

// @desc    Get all teams (Admin)
// @route   GET /api/teams/admin/all
// @access  Admin
const getAllTeams = asyncHandler(async (req, res) => {
  const teams = await Team.find()
    .populate("leader", "name email avatar")
    .populate("members.user", "name email avatar")
    .populate("hackathon", "title mode status")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, { teams }, "All teams fetched"));
});

module.exports = {
  createTeam,
  getTeamsByHackathon,
  getTeamById,
  updateTeam,
  inviteMember,
  respondToInvitation,
  removeMember,
  transferLeader,
  leaveTeam,
  deleteTeam,
  getMyTeam,
  getMyPendingInvitations,
  getAllTeams,
};
