const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // No two users can have the same email
  },
  password: {
    type: String,
    required: true,
  },
  // We link this user to their profile data
  profile: {
    type: Schema.Types.ObjectId,
    ref: 'StudentProfile'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);