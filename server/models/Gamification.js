const mongoose = require('mongoose');

const gamificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  points: {
    type: Number,
    default: 0,
  },
  badges: [{
    type: String,
  }],
  currentLevel: {
    type: Number,
    default: 1,
  }
}, { timestamps: true });

module.exports = mongoose.model('Gamification', gamificationSchema);
