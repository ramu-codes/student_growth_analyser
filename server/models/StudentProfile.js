const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StudentProfileSchema = new Schema({
  // Link back to the User model
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple nulls, but unique if a value exists
  },
  currentYear: {
    type: Number,
    min: 1,
    max: 5,
  },
  branch: {
    type: String,
  },
  enrolledSubjects: [{
    type: String,
  }],
  academicGoals: {
    cgpaTarget: { type: Number, min: 0, max: 10 },
    placementTarget: { type: String }
  },
  // --- Academic Features ---
   gpaHistory: [
    {
      semester: { type: String, required: true }, // e.g., "Sem 1", "Sem 2"
      gpa: { type: Number, required: true, min: 0, max: 10 }
    }
   ],

  attendancePercentage: {
    type: Number,
    default: 0,
  },
  // --- Technical Features ---
  githubUsername: {
    type: String,
  },
  leetcodeUsername: {
    type: String,
  },
  linkedinProfile: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', StudentProfileSchema);