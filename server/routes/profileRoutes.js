const express = require('express');
const router = express.Router();
const { getStudentProfile, updateStudentProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

// Here, we chain the GET and PUT requests for the same route: '/me'.
// We add 'protect' as the first argument, so it runs before the controller.
router
  .route('/me')
  .get(protect, getStudentProfile)   // GET request runs getStudentProfile
  .put(protect, updateStudentProfile); // PUT request runs updateStudentProfile

module.exports = router;