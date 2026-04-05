const mongoose = require('mongoose');

const subjectMarkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  examType: {
    type: String,
    enum: ['mid', 'end', 'test', 'assignment'],
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  maxScore: {
    type: Number,
    required: true,
  },
  attendancePercentage: {
    type: Number,
    default: 100,
  },
  semester: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model('SubjectMark', subjectMarkSchema);
