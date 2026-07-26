const mongoose = require("mongoose");

const hackathonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [3000, "Description cannot exceed 3000 characters"],
    },
    theme: {
      type: String,
      required: [true, "Theme is required"],
      trim: true,
    },
    mode: {
      type: String,
      enum: ["online", "offline", "hybrid"],
      required: [true, "Mode is required"],
    },
    venue: {
      type: String,
      default: "",
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    registrationDeadline: {
      type: Date,
      required: [true, "Registration deadline is required"],
    },
    bannerImage: {
      type: String,
      default: "",
    },
    bannerImagePublicId: {
      type: String,
      default: "",
    },
    prizePool: {
      type: String,
      default: "",
    },
    maxTeamSize: {
      type: Number,
      required: [true, "Maximum team size is required"],
      min: [1, "Team size must be at least 1"],
      max: [10, "Team size cannot exceed 10"],
      default: 4,
    },
    minTeamSize: {
      type: Number,
      default: 1,
      min: 1,
    },
    rules: [{ type: String }],
    judgingCriteria: [
      {
        criterion: { type: String, required: true },
        maxMarks: { type: Number, required: true, min: 1 },
        description: { type: String, default: "" },
      },
    ],
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedJudges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["draft", "upcoming", "registration_open", "registration_closed", "ongoing", "completed", "cancelled"],
      default: "draft",
    },
    registrationOpen: {
      type: Boolean,
      default: false,
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    website: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    // Winner info (published after completion)
    winners: [
      {
        position: { type: Number },
        team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
        prize: { type: String, default: "" },
      },
    ],
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
hackathonSchema.index({ organizer: 1 });
hackathonSchema.index({ status: 1 });
hackathonSchema.index({ theme: "text", title: "text", description: "text" });

module.exports = mongoose.model("Hackathon", hackathonSchema);
