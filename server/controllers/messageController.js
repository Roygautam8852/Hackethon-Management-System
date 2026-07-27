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
          name: h.organizer.name || h.organizer.email || "Organizer",
          email: h.organizer.email || "",
          avatar: h.organizer.avatar || "",
          role: h.organizer.role || "organizer",
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
        const regs = await Registration.find({ hackathon: { $in: myHackathonIds } })
          .populate("registeredBy", "name email avatar role")
          .populate({
            path: "team",
            populate: { path: "leader members", select: "name email avatar role" }
          });

        regs.forEach(r => {
          if (r.team && r.team.leader && r.team.leader._id.toString() !== currentUser._id.toString()) {
            contacts.push({
              _id: r.team.leader._id.toString(),
              name: r.team.leader.name || r.team.leader.email || "Team Leader",
              email: r.team.leader.email || "",
              avatar: r.team.leader.avatar || "",
              role: r.team.leader.role || "participant",
              category: "Participants & Teams",
              subtext: `Team Leader (Team: ${r.team.name})`,
              type: "direct",
            });
          } else if (r.registeredBy && r.registeredBy._id.toString() !== currentUser._id.toString()) {
            contacts.push({
              _id: r.registeredBy._id.toString(),
              name: r.registeredBy.name || r.registeredBy.email || "Participant",
              email: r.registeredBy.email || "",
              avatar: r.registeredBy.avatar || "",
              role: r.registeredBy.role || "participant",
              category: "Participants & Teams",
              subtext: r.team ? `Team Leader (Team: ${r.team.name})` : "Participant",
              type: "direct",
            });
          }
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
      allParticipants.forEach(p => contacts.push({ _id: p._id.toString(), name: p.name, email: p.email, avatar: p.avatar, role: p.role, category: "Participants & Teams", subtext: "Hacker / Developer", type: "direct" }));
    }
  }

  // Deduplicate contacts by _id
  const uniqueMap = new Map();
  contacts.forEach(c => {
    if (!uniqueMap.has(c._id)) {
      uniqueMap.set(c._id, c);
    }
  });

  const contactsArray = Array.from(uniqueMap.values());

  // Attach actual hackathon titles for all organizer contacts
  const organizerIds = contactsArray
    .filter(c => c.role === "organizer")
    .map(c => c._id);

  if (organizerIds.length > 0) {
    const hackathons = await Hackathon.find({ organizer: { $in: organizerIds } }).select("title organizer");
    const hackathonMap = new Map();
    hackathons.forEach(h => {
      if (h.organizer) {
        const orgId = h.organizer.toString();
        const titles = hackathonMap.get(orgId) || [];
        titles.push(h.title);
        hackathonMap.set(orgId, titles);
      }
    });

    contactsArray.forEach(c => {
      if (c.role === "organizer") {
        const titles = hackathonMap.get(c._id);
        if (titles && titles.length > 0) {
          c.subtext = `Hackathon: ${titles.slice(0, 2).join(", ")}`;
        } else if (!c.subtext || c.subtext === "Hackathon Organizer" || c.subtext === "Platform Organizer") {
          c.subtext = "Organizer (No active event)";
        }
      }
    });
  }

  // Calculate unread direct message counts for currentUser
  const unreadCounts = await Message.aggregate([
    {
      $match: {
        recipient: currentUser._id,
        read: false,
        chatType: "direct",
      },
    },
    {
      $group: {
        _id: "$sender",
        count: { $sum: 1 },
      },
    },
  ]);

  const unreadMap = new Map();
  unreadCounts.forEach(u => unreadMap.set(u._id.toString(), u.count));

  // Aggregate last message info for each contact pair involving currentUser
  const lastMessages = await Message.aggregate([
    {
      $match: {
        chatType: "direct",
        $or: [
          { sender: currentUser._id },
          { recipient: currentUser._id },
        ],
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ["$sender", currentUser._id] },
            "$recipient",
            "$sender",
          ],
        },
        content: { $first: "$content" },
        createdAt: { $first: "$createdAt" },
      },
    },
  ]);

  const lastMessageMap = new Map();
  lastMessages.forEach(lm => {
    if (lm._id) {
      lastMessageMap.set(lm._id.toString(), {
        content: lm.content,
        time: lm.createdAt,
      });
    }
  });

  const finalContacts = contactsArray.map(c => {
    const lastMsg = lastMessageMap.get(c._id);
    return {
      ...c,
      unreadCount: unreadMap.get(c._id) || 0,
      lastMessage: lastMsg ? lastMsg.content : "",
      lastMessageTime: lastMsg ? lastMsg.time : null,
    };
  });

  // Sort contacts by most recent message timestamp descending, then unread count, then name
  finalContacts.sort((a, b) => {
    const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
    const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;

    if (timeA !== timeB) return timeB - timeA;
    if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
    return (a.name || "").localeCompare(b.name || "");
  });

  res.status(200).json(new ApiResponse(200, { contacts: finalContacts }, "Contacts fetched successfully"));
});

// @desc    Get 1-to-1 direct messages between current user and target user
// @route   GET /api/messages/direct/:userId
// @access  Private
const getDirectMessages = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  // Mark all unread messages from this sender as read
  await Message.updateMany(
    { sender: userId, recipient: currentUserId, read: false },
    { $set: { read: true } }
  );

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

// @desc    Mark direct messages as read
// @route   PATCH /api/messages/direct/:userId/read
// @access  Private
const markDirectMessagesAsRead = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  await Message.updateMany(
    { sender: userId, recipient: currentUserId, read: false },
    { $set: { read: true } }
  );

  res.status(200).json(new ApiResponse(200, {}, "Messages marked as read"));
});

module.exports = {
  sendMessage,
  getMessages,
  getChatContacts,
  getDirectMessages,
  sendDirectMessage,
  markDirectMessagesAsRead,
};
