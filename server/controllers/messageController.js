const asyncHandler = require("express-async-handler");
const Message = require("../models/Message");
const Team = require("../models/Team");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// @desc    Send a group chat message
// @route   POST /api/messages
// @access  Private (All Roles)
const sendMessage = asyncHandler(async (req, res) => {
  const { content, hackathonId } = req.body;

  if (!content || !content.trim()) {
    throw new ApiError(400, "Message content cannot be empty");
  }

  const role = req.user.role;
  let teamName = "";

  // For participants: find their team name so ONLY team name is shown instead of member names
  if (role === "participant") {
    const userTeam = await Team.findOne({
      $or: [
        { leader: req.user._id },
        { members: req.user._id },
      ],
    });

    if (userTeam) {
      teamName = userTeam.name;
    } else {
      teamName = "Participant Team";
    }
  }

  const message = await Message.create({
    sender: req.user._id,
    senderRole: role,
    senderName: req.user.name,
    teamName: teamName,
    hackathon: hackathonId || null,
    content: content.trim(),
  });

  res.status(201).json(new ApiResponse(201, { message }, "Message sent"));
});

// @desc    Get group chat messages
// @route   GET /api/messages
// @access  Private (All Roles)
const getMessages = asyncHandler(async (req, res) => {
  const { hackathonId } = req.query;

  const query = {};
  if (hackathonId) {
    query.hackathon = hackathonId;
  }

  const messages = await Message.find(query)
    .sort({ createdAt: 1 })
    .limit(100);

  res.status(200).json(new ApiResponse(200, { messages }, "Messages fetched successfully"));
});

module.exports = {
  sendMessage,
  getMessages,
};
