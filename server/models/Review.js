const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: true,
    },
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: true,
    },
    judge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Per-criterion scores: [{ criterion: "Innovation", marks: 18, maxMarks: 20 }]
    scores: [
      {
        criterion: { type: String, required: true },
        marks: { type: Number, required: true, min: 0 },
        maxMarks: { type: Number, required: true, min: 1 },
      },
    ],
    totalScore: { type: Number, default: 0 },
    feedback: { type: String, maxlength: 2000, default: "" },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One review per judge per submission
reviewSchema.index({ submission: 1, judge: 1 }, { unique: true });
reviewSchema.index({ hackathon: 1 });

// Auto-compute totalScore before save
reviewSchema.pre("save", function () {
  this.totalScore = this.scores.reduce((sum, s) => sum + (s.marks || 0), 0);
});

module.exports = mongoose.model("Review", reviewSchema);
