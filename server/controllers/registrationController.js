const asyncHandler = require("express-async-handler");
const Registration = require("../models/Registration");
const Team = require("../models/Team");
const Hackathon = require("../models/Hackathon");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const sendEmail = require("../utils/sendEmail");

// @desc    Register a team for a hackathon
// @route   POST /api/registrations
// @access  Participant (team leader)
const registerTeam = asyncHandler(async (req, res) => {
  const { teamId, hackathonId } = req.body;

  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) throw new ApiError(404, "Hackathon not found");

  if (!hackathon.registrationOpen) {
    throw new ApiError(400, "Registration is currently closed for this hackathon");
  }

  if (new Date() > hackathon.registrationDeadline) {
    throw new ApiError(400, "Registration deadline has passed");
  }

  const team = await Team.findById(teamId).populate("leader members.user");
  if (!team) throw new ApiError(404, "Team not found");

  if (team.leader._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only team leader can register the team");
  }

  if (team.hackathon.toString() !== hackathonId) {
    throw new ApiError(400, "Team does not belong to this hackathon");
  }

  const existingReg = await Registration.findOne({ hackathon: hackathonId, team: teamId });
  if (existingReg) {
    throw new ApiError(409, "Team is already registered for this hackathon");
  }

  const registration = await Registration.create({
    hackathon: hackathonId,
    team: teamId,
    registeredBy: req.user._id,
  });

  await registration.populate([
    { path: "team", populate: { path: "leader", select: "name email" } },
    { path: "hackathon", select: "title" },
  ]);

  res.status(201).json(new ApiResponse(201, { registration }, "Team registered successfully"));
});

// @desc    Get registrations for a hackathon (organizer view)
// @route   GET /api/registrations/hackathon/:hackathonId
// @access  Organizer | Admin
const getRegistrationsByHackathon = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = { hackathon: req.params.hackathonId };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [registrations, total] = await Promise.all([
    Registration.find(query)
      .populate({ path: "team", populate: [{ path: "leader", select: "name email avatar" }, { path: "members.user", select: "name email" }] })
      .populate("registeredBy", "name email")
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Registration.countDocuments(query),
  ]);

  res.status(200).json(
    new ApiResponse(200, { registrations, total, page: Number(page) }, "Registrations fetched")
  );
});

// @desc    Approve registration
// @route   PATCH /api/registrations/:id/approve
// @access  Organizer
const approveRegistration = asyncHandler(async (req, res) => {
  const registration = await Registration.findById(req.params.id)
    .populate({ path: "team", populate: { path: "leader", select: "name email" } })
    .populate("hackathon", "title organizer");

  if (!registration) throw new ApiError(404, "Registration not found");

  if (registration.hackathon.organizer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  registration.status = "approved";
  await registration.save();

  // Update team status
  await Team.findByIdAndUpdate(registration.team._id, { status: "approved" });

  // Send email notification
  try {
    await sendEmail({
      to: registration.team.leader.email,
      subject: `🎉 Registration Approved — ${registration.hackathon.title}`,
      html: `<h2>Congratulations!</h2><p>Your team <strong>${registration.team.name}</strong> has been approved for <strong>${registration.hackathon.title}</strong>.</p>`,
    });
  } catch (_) {}

  res.status(200).json(new ApiResponse(200, { registration }, "Registration approved"));
});

// @desc    Reject registration
// @route   PATCH /api/registrations/:id/reject
// @access  Organizer
const rejectRegistration = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const registration = await Registration.findById(req.params.id)
    .populate({ path: "team", populate: { path: "leader", select: "name email" } })
    .populate("hackathon", "title organizer");

  if (!registration) throw new ApiError(404, "Registration not found");

  if (registration.hackathon.organizer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  registration.status = "rejected";
  registration.rejectionReason = reason || "";
  await registration.save();

  await Team.findByIdAndUpdate(registration.team._id, { status: "rejected" });

  try {
    await sendEmail({
      to: registration.team.leader.email,
      subject: `Registration Update — ${registration.hackathon.title}`,
      html: `<p>Your team's registration was not approved. Reason: ${reason || "No reason provided."}</p>`,
    });
  } catch (_) {}

  res.status(200).json(new ApiResponse(200, { registration }, "Registration rejected"));
});

// @desc    Cancel registration (participant)
// @route   DELETE /api/registrations/:id
// @access  Participant (team leader)
const cancelRegistration = asyncHandler(async (req, res) => {
  const registration = await Registration.findById(req.params.id);
  if (!registration) throw new ApiError(404, "Registration not found");

  if (registration.registeredBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  await registration.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Registration cancelled"));
});

// @desc    Get my registrations (as leader OR as team member)
// @route   GET /api/registrations/my
// @access  Participant
const getMyRegistrations = asyncHandler(async (req, res) => {
  // Find all teams the user belongs to (as leader or accepted member)
  const Team = require("../models/Team");
  const myTeams = await Team.find({
    $or: [
      { leader: req.user._id },
      { members: { $elemMatch: { user: req.user._id, status: "accepted" } } },
    ],
  }).select("_id");

  const teamIds = myTeams.map(t => t._id);

  const registrations = await Registration.find({
    $or: [
      { registeredBy: req.user._id },
      { team: { $in: teamIds } },
    ],
  })
    .populate("hackathon", "title bannerImage status startDate endDate mode registrationOpen registrationDeadline")
    .populate({ path: "team", select: "name members status leader", populate: { path: "leader", select: "name email" } })
    .sort({ registeredAt: -1 });

  res.status(200).json(new ApiResponse(200, { registrations }, "Your registrations fetched"));
});

module.exports = {
  registerTeam,
  getRegistrationsByHackathon,
  approveRegistration,
  rejectRegistration,
  cancelRegistration,
  getMyRegistrations,
};
