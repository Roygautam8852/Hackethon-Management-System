const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
      maxlength: [60, "Team name cannot exceed 60 characters"],
    },
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: true,
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ["forming", "registered", "approved", "rejected", "disqualified"],
      default: "forming",
    },
    description: { type: String, default: "", maxlength: 500 },
    lookingForMembers: { type: Boolean, default: true },
    techStack: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

teamSchema.index({ hackathon: 1 });
teamSchema.index({ leader: 1 });

module.exports = mongoose.model("Team", teamSchema);
