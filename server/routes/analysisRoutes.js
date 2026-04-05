const express = require('express');
const router = express.Router();
const { getGrowthAnalysis, getPerformanceTrends, getSemesterBreakdown } = require('../controllers/analysisController');
const { protect } = require('../middleware/authMiddleware');

router.get('/my-growth', protect, getGrowthAnalysis);
router.get('/trends', protect, getPerformanceTrends);
router.get('/semester-breakdown', protect, getSemesterBreakdown);

module.exports = router;