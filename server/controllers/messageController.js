const asyncHandler = require("express-async-handler");
const Message = require("../models/Message");
const Team = require("../models/Team");
const User = require("../models/User");
const Hackathon = require("../models/Hackathon");
const Registration = require("../models/Registration");
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
    chatType: "group",
    content: content.trim(),
  });

  res.status(201).json(new ApiResponse(201, { message }, "Message sent"));
});

// @desc    Get group chat messages
// @route   GET /api/messages
// @access  Private (All Roles)
const getMessages = asyncHandler(async (req, res) => {
  const { hackathonId } = req.query;

  const query = { chatType: "group" };
  if (hackathonId) {
    query.hackathon = hackathonId;
  }

  const messages = await Message.find(query)
    .sort({ createdAt: 1 })
    .limit(100);

  res.status(200).json(new ApiResponse(200, { messages }, "Messages fetched successfully"));
});

// @desc    Get contacts list categorized by role for WhatsApp-style chat
// @desc    Get contacts list categorized by role for WhatsApp-style chat
// @route   GET /api/messages/contacts
// @access  Private (All Roles)
const getChatContacts = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  let contacts = [];

  if (currentUser.role === "participant") {
    // Participant: ONLY get organizers of hackathons in which this participant or their team is registered
    const userTeams = await Team.find({
      $or: [{ leader: currentUser._id }, { members: currentUser._id }],
    }).select("_id");
    const teamIds = userTeams.map(t => t._id);

    const myRegistrations = await Registration.find({
      $or: [
        { registeredBy: currentUser._id },
        { team: { $in: teamIds } }
      ]
    }).populate({
      path: "hackathon",
      populate: { path: "organizer", select: "name email avatar role" }
    });

    const registeredHackathons = myRegistrations.map(r => r.hackathon).filter(Boolean);

    registeredHackathons.forEach(h => {
      if (h.organizer && h.organizer._id.toString() !== currentUser._id.toString()) {
        contacts.push({
          _id: h.organizer._id.toString(),
          name: h.organizer.name,
          email: h.organizer.email,
          avatar: h.organizer.avatar,
          role: h.organizer.role,
          category: "Organizers",
          subtext: `Hackathon: ${h.title}`,
          hackathonId: h._id,
          type: "direct",
        });
      }
    });
  } else {
    // Always fetch platform Admins for direct messaging for non-participant roles
    const admins = await User.find({ role: "admin", _id: { $ne: currentUser._id } })
      .select("name email avatar role bio")
      .sort({ name: 1 });

    admins.forEach(a => {
      contacts.push({
        _id: a._id.toString(),
        name: a.name,
        email: a.email,
        avatar: a.avatar,
        role: a.role,
        category: "Admins",
        subtext: "System Administrator",
        type: "direct",
      });
    });

    if (currentUser.role === "organizer") {
      // Organizer: get all judges
      const judges = await User.find({ role: "judge", isApproved: { $ne: false }, isBlocked: false })
        .select("name email avatar role skills")
        .sort({ name: 1 });

      judges.forEach(j => {
        contacts.push({
          _id: j._id.toString(),
          name: j.name,
          email: j.email,
          avatar: j.avatar,
          role: j.role,
          category: "Judges",
          subtext: j.skills?.length ? `Skills: ${j.skills.slice(0, 2).join(", ")}` : "Evaluator",
          type: "direct",
        });
      });

      // Organizer: get participants & team leaders of their hackathons
      const myHackathons = await Hackathon.find({ organizer: currentUser._id });
      const myHackathonIds = myHackathons.map(h => h._id);

      if (myHackathonIds.length > 0) {
        const regs = await Registration.find({ hackathon: { $in: myHackathonIds } }).populate("user", "name email avatar role");
        regs.forEach(r => {
          if (r.user && r.user._id.toString() !== currentUser._id.toString()) {
            contacts.push({
              _id: r.user._id.toString(),
              name: r.user.name,
              email: r.user.email,
              avatar: r.user.avatar,
              role: r.user.role,
              category: "Participants & Teams",
              subtext: `Participant`,
              type: "direct",
            });
          }
        });

        // Group Channels for their hackathons
        myHackathons.forEach(h => {
          contacts.push({
            _id: `group_${h._id}`,
            name: `${h.title} (Channel)`,
            avatar: h.bannerImage || "",
            role: "group",
            category: "Group Channels",
            subtext: "Organizer Forum",
            hackathonId: h._id,
            type: "group",
          });
        });
      }
    } else if (currentUser.role === "judge") {
      // Judge: get organizers
      const organizers = await User.find({ role: "organizer", isApproved: { $ne: false }, isBlocked: false })
        .select("name email avatar role")
        .sort({ name: 1 });

      organizers.forEach(o => {
        contacts.push({
          _id: o._id.toString(),
          name: o.name,
          email: o.email,
          avatar: o.avatar,
          role: o.role,
          category: "Organizers",
          subtext: "Hackathon Organizer",
          type: "direct",
        });
      });
    } else if (currentUser.role === "admin") {
      // Admin: get all organizers, judges, participants
      const [allOrganizers, allJudges, allParticipants] = await Promise.all([
        User.find({ role: "organizer", _id: { $ne: currentUser._id } }).select("name email avatar role"),
        User.find({ role: "judge", _id: { $ne: currentUser._id } }).select("name email avatar role"),
        User.find({ role: "participant", _id: { $ne: currentUser._id } }).select("name email avatar role").limit(30),
      ]);

      allOrganizers.forEach(o => contacts.push({ _id: o._id.toString(), name: o.name, email: o.email, avatar: o.avatar, role: o.role, category: "Organizers", subtext: "Platform Organizer", type: "direct" }));
      allJudges.forEach(j => contacts.push({ _id: j._id.toString(), name: j.name, email: j.email, avatar: j.avatar, role: j.role, category: "Judges", subtext: "Platform Judge", type: "direct" }));
      allParticipants.forEach(p => contacts.push({ _id: p._id.toString(), name: p.name, email: p.email, avatar: p.avatar, role: p.role, category: "Participants", subtext: "Hacker / Developer", type: "direct" }));
    }

    // Always add Global Group Chat for admins/organizers/judges
    contacts.unshift({
      _id: "group_global",
      name: "Global Platform Discussion",
      avatar: "",
      role: "group",
      category: "Group Channels",
      subtext: "Public chat for all members",
      hackathonId: null,
      type: "group",
    });
  }

  // Deduplicate contacts by _id
  const uniqueMap = new Map();
  contacts.forEach(c => {
    if (!uniqueMap.has(c._id)) {
      uniqueMap.set(c._id, c);
    }
  });

  res.status(200).json(new ApiResponse(200, { contacts: Array.from(uniqueMap.values()) }, "Contacts fetched successfully"));
});

// @desc    Get 1-to-1 direct messages between current user and target user
// @route   GET /api/messages/direct/:userId
// @access  Private
const getDirectMessages = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  const messages = await Message.find({
    chatType: "direct",
    $or: [
      { sender: currentUserId, recipient: userId },
      { sender: userId, recipient: currentUserId },
    ],
  }).sort({ createdAt: 1 });

  res.status(200).json(new ApiResponse(200, { messages }, "Direct messages fetched"));
});

// @desc    Send 1-to-1 direct message
// @route   POST /api/messages/direct
// @access  Private
const sendDirectMessage = asyncHandler(async (req, res) => {
  const { recipientId, content } = req.body;

  if (!recipientId || !content || !content.trim()) {
    throw new ApiError(400, "Recipient ID and content are required");
  }

  const recipient = await User.findById(recipientId);
  if (!recipient) throw new ApiError(404, "Recipient not found");

  const message = await Message.create({
    sender: req.user._id,
    senderRole: req.user.role,
    senderName: req.user.name,
    recipient: recipient._id,
    chatType: "direct",
    content: content.trim(),
  });

  res.status(201).json(new ApiResponse(201, { message }, "Direct message sent"));
});

module.exports = {
  sendMessage,
  getMessages,
  getChatContacts,
  getDirectMessages,
  sendDirectMessage,
};
