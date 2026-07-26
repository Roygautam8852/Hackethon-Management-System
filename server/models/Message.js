const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["admin", "organizer", "judge", "participant"],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    teamName: {
      type: String,
      default: "",
    },
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      default: null,
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
