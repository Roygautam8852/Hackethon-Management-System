const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    rejectionReason: { type: String, default: "" },
    registeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index: one registration per team per hackathon
registrationSchema.index({ hackathon: 1, team: 1 }, { unique: true });

module.exports = mongoose.model("Registration", registrationSchema);
