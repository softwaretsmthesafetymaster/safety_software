import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema({
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  passed: { type: Boolean, default: false },
  timeSpent: { type: Number, default: 0 }, // seconds
  attemptedAt: { type: Date, default: Date.now },
  answers: [{}] // store user answers (flexible)
});

const gameProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BBSGame",
      required: true
    },

    // attempts & scores
    attempts: [attemptSchema],
    totalAttempts: { type: Number, default: 0 },
    lastScore: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },

    // completion status
    completed: { type: Boolean, default: false },
    lastAttempted: { type: Date }
  },
  { timestamps: true }
);

// ✅ Ensure one document per user per game
gameProgressSchema.index({ userId: 1, gameId: 1 }, { unique: true });

// ✅ For leaderboard queries
gameProgressSchema.index({ companyId: 1, bestScore: -1 });

const GameProgress = mongoose.model("BBSGameProgress", gameProgressSchema);

export default GameProgress;
