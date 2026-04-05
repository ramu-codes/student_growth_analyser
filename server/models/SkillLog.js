const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SkillLogSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // e.g., "LeetCode", "Project", "Course", "Github Commit"
  category: {
    type: String,
    required: true,
    enum: ['LeetCode', 'HackerRank', 'Project', 'Course', 'GitHub'],
  },
  // e.g., "Completed 10 new problems", "Pushed 5 commits", "Finished React Basics"
  description: {
    type: String,
    required: true,
  },
  // A numerical value, e.g., 10 (problems), 5 (commits), 3 (hours spent)
  value: {
    type: Number,
    default: 1,
  },
  // The date the skill was logged
  date: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model('SkillLog', SkillLogSchema);