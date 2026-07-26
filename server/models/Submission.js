const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectName: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      maxlength: 100,
    },
    problemStatement: {
      type: String,
      required: [true, "Problem statement is required"],
      maxlength: 2000,
    },
    solutionDescription: {
      type: String,
      required: [true, "Solution description is required"],
      maxlength: 5000,
    },
    githubRepo: { type: String, default: "" },
    liveDemoUrl: { type: String, default: "" },
    demoVideoLink: { type: String, default: "" },
    techStack: [{ type: String, trim: true }],
    screenshots: [
      {
        url: { type: String },
        publicId: { type: String },
      },
    ],
    presentationPdf: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected"],
      default: "pending",
    },
    assignedJudges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// One submission per team per hackathon
submissionSchema.index({ hackathon: 1, team: 1 }, { unique: true });
submissionSchema.index({ hackathon: 1 });

module.exports = mongoose.model("Submission", submissionSchema);
