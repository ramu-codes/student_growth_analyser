const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ActivityLogSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // e.g., "Volunteering", "Leadership", "Event", "Arts"
  category: {
    type: String,
    required: true,
    enum: ['Volunteering', 'Leadership', 'Event', 'Arts', 'Sports', 'Other'],
  },
  // e.g., "Organized 'CodeFest'", "Volunteered at NGO"
  title: {
    type: String,
    required: true,
  },
  hoursSpent: {
    type: Number,
    default: 0,
  },
  // The date the activity occurred
  date: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);