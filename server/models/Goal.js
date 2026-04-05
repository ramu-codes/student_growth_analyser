const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['academic', 'coding', 'project'],
    default: 'academic'
  },
  
  // Base fields
  deadline: { type: Date },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'failed'],
    default: 'in-progress'
  },

  // 1. ACADEMIC SPECIFIC
  targetPercentage: { type: Number, min: 0, max: 100 },
  currentPercentage: { type: Number, default: 0, min: 0, max: 100 },

  // 2. PROJECT SPECIFIC
  projectDetails: {
    description: String,
    techStack: [String]
  },

  // 3. CODING SPECIFIC (Leetcode Integration)
  codingDetails: {
    platform: { type: String, default: 'leetcode' },
    username: String,
    targetDays: Number,
    targetProblems: Number,
    startingProblemsSolved: Number, // Snapshot when goal is created
    currentProblemsSolved: { type: Number, default: 0 },
    
    // Difficulty Tracking
    easySolved: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },

    // Custom Daily Tracking logic
    problemsSolvedYesterday: { type: Number, default: 0 },
    problemsSolvedToday: { type: Number, default: 0 },
    solvedToday: { type: Boolean, default: false },
    solvedYesterday: { type: Boolean, default: false },
    currentStreak: { type: Number, default: 0 },
    lastCheckedDate: Date,
  }
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);

