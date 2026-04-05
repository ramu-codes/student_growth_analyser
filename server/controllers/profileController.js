const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');

// ==========================================================
// @desc    Get the logged-in user's profile
// @route   GET /api/profile/me
// @access  Private (uses 'protect' middleware)
// ==========================================================
const getStudentProfile = async (req, res) => {
  try {
    // Find the profile linked to the logged-in user's ID
    const profile = await StudentProfile.findOne({ user: req.user._id })
      .populate('user', ['name', 'email']); // Include name & email from User collection

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error.message);
    res.status(500).send('Server Error');
  }
};

// ==========================================================
// @desc    Update the logged-in user's profile
// @route   PUT /api/profile/me
// @access  Private (uses 'protect' middleware)
// ==========================================================
const updateStudentProfile = async (req, res) => {
  const {
    studentId,
    currentYear,
    branch,
    gpaHistory,              // <-- Array of GPA values per semester
    attendancePercentage,
    githubUsername,
    leetcodeUsername,
    linkedinProfile,
  } = req.body;

  // Build the profile fields object
  const profileFields = { user: req.user._id };

  if (studentId) profileFields.studentId = studentId;
  if (currentYear) profileFields.currentYear = currentYear;
  if (branch) profileFields.branch = branch;
  if (gpaHistory) profileFields.gpaHistory = gpaHistory; // New array field
  if (attendancePercentage) profileFields.attendancePercentage = attendancePercentage;
  if (githubUsername) profileFields.githubUsername = githubUsername;
  if (leetcodeUsername) profileFields.leetcodeUsername = leetcodeUsername;
  if (linkedinProfile) profileFields.linkedinProfile = linkedinProfile;

  try {
    // Check if profile already exists
    let profile = await StudentProfile.findOne({ user: req.user._id });

    if (profile) {
      // If it exists → update
      profile = await StudentProfile.findOneAndUpdate(
        { user: req.user._id },
        { $set: profileFields },
        { new: true } // Return updated document
      );
      return res.json(profile);
    }

    // If no profile exists → create one
    profile = new StudentProfile(profileFields);
    await profile.save();
    res.json(profile);

  } catch (error) {
    console.error('Error updating profile:', error.message);
    res.status(500).send('Server Error');
  }
};

module.exports = {
  getStudentProfile,
  updateStudentProfile,
};
