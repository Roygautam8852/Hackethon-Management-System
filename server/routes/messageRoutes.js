const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { sendMessage, getMessages } = require("../controllers/messageController");

router.use(protect);

router.post("/", sendMessage);
router.get("/", getMessages);

module.exports = router;
