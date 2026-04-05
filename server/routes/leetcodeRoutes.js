const express = require('express');
const router = express.Router();
const { getLeetcodeStats } = require('../controllers/leetcodeController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats', protect, getLeetcodeStats);

module.exports = router;
