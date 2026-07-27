const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  sendMessage, getMessages, getChatContacts, getDirectMessages, sendDirectMessage,
} = require("../controllers/messageController");

router.use(protect);

router.post("/", sendMessage);
router.get("/", getMessages);

router.get("/contacts", getChatContacts);
router.get("/direct/:userId", getDirectMessages);
router.post("/direct", sendDirectMessage);

module.exports = router;
