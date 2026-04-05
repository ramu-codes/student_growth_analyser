const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/authMiddleware');
const SubjectMark = require('../models/SubjectMark');

const FLASK_URL = process.env.FLASK_URL || 'http://localhost:8000';

// =============================================
// LOCAL FALLBACK FUNCTIONS (work without Flask)
// =============================================

function generateLocalInsights(marks) {
  if (!marks || marks.length === 0) {
    return ['Add more exam marks to generate personalized insights!'];
  }

  const insights = [];
  const subjectMap = {};

  marks.forEach(m => {
    if (!subjectMap[m.subject]) subjectMap[m.subject] = [];
    subjectMap[m.subject].push({
      pct: (m.score / m.maxScore) * 100,
      attendance: m.attendancePercentage || 100,
      examType: m.examType
    });
  });

  const subjectAvgs = Object.entries(subjectMap).map(([subject, entries]) => ({
    subject,
    avg: entries.reduce((a, e) => a + e.pct, 0) / entries.length,
    avgAttendance: entries.reduce((a, e) => a + e.attendance, 0) / entries.length,
    count: entries.length
  }));

  // Sort by average
  subjectAvgs.sort((a, b) => a.avg - b.avg);

  const weakest = subjectAvgs[0];
  const strongest = subjectAvgs[subjectAvgs.length - 1];

  if (weakest && strongest && weakest.subject !== strongest.subject) {
    insights.push(`⚠️ Your weakest subject is ${weakest.subject} with an average of ${weakest.avg.toFixed(1)}%. Consider allocating more study time here.`);
    insights.push(`✅ Excellent performance in ${strongest.subject} with an average of ${strongest.avg.toFixed(1)}%. Keep up the great work!`);
  }

  // Check performance gap
  if (strongest && weakest && (strongest.avg - weakest.avg) > 25) {
    insights.push(`📊 There's a ${(strongest.avg - weakest.avg).toFixed(0)}% gap between your strongest and weakest subjects. Balancing your effort could improve your overall growth index significantly.`);
  }

  // Attendance check
  const lowAttendance = subjectAvgs.filter(s => s.avgAttendance < 75);
  if (lowAttendance.length > 0) {
    const subjects = lowAttendance.map(s => s.subject).join(', ');
    insights.push(`🚨 Low attendance detected in: ${subjects}. Attendance below 75% is shown to correlate with lower scores.`);
  }

  // Overall trend
  const overallAvg = subjectAvgs.reduce((a, s) => a + s.avg, 0) / subjectAvgs.length;
  if (overallAvg >= 80) {
    insights.push(`🌟 Your overall average of ${overallAvg.toFixed(1)}% places you in the top tier. Focus on maintaining consistency.`);
  } else if (overallAvg >= 60) {
    insights.push(`📈 Your overall average is ${overallAvg.toFixed(1)}%. With targeted effort on weak areas, you can break into the 80%+ range.`);
  } else {
    insights.push(`💡 Your overall average is ${overallAvg.toFixed(1)}%. Start with the fundamentals — review your notes daily and practice previous exam papers.`);
  }

  return insights;
}

function generateLocalRecommendations(marks) {
  if (!marks || marks.length === 0) {
    return ['Start by logging your academic performance to get personalized recommendations.'];
  }

  const subjectMap = {};
  marks.forEach(m => {
    if (!subjectMap[m.subject]) subjectMap[m.subject] = [];
    subjectMap[m.subject].push((m.score / m.maxScore) * 100);
  });

  const subjectAvgs = Object.entries(subjectMap).map(([subject, scores]) => ({
    subject,
    avg: scores.reduce((a, b) => a + b, 0) / scores.length
  }));

  subjectAvgs.sort((a, b) => a.avg - b.avg);
  const weakest = subjectAvgs[0];

  const recommendations = [];
  if (weakest) {
    recommendations.push(`Focus primarily on ${weakest.subject}. Allocate 40% of your study time to this subject.`);
  }
  recommendations.push('Review previous exam mistakes and create a list of frequently tested concepts.');
  recommendations.push('Practice active recall — try explaining concepts without looking at notes.');
  recommendations.push('Use spaced repetition for memorization-heavy subjects.');

  return recommendations;
}

function generateLocalRoadmap(marks) {
  const roadmap = [
    { week: 'Week 1', task: 'Identify knowledge gaps and gather study materials for all subjects.' },
    { week: 'Week 2', task: 'Practice fundamental concepts and solve basic problems.' },
    { week: 'Week 3', task: 'Attempt past papers and timed mock tests.' },
    { week: 'Week 4', task: 'Final revision and focus on weak areas discovered in mocks.' }
  ];

  if (marks && marks.length > 0) {
    const subjectMap = {};
    marks.forEach(m => {
      if (!subjectMap[m.subject]) subjectMap[m.subject] = [];
      subjectMap[m.subject].push((m.score / m.maxScore) * 100);
    });

    const subjectAvgs = Object.entries(subjectMap).map(([subject, scores]) => ({
      subject,
      avg: scores.reduce((a, b) => a + b, 0) / scores.length
    }));
    subjectAvgs.sort((a, b) => a.avg - b.avg);
    const weakest = subjectAvgs[0];

    if (weakest) {
      return [
        { week: 'Week 1', task: `Deep dive into ${weakest.subject} (your weakest at ${weakest.avg.toFixed(0)}%). Re-read core textbook chapters and watch lecture recordings.` },
        { week: 'Week 2', task: `Solve 20+ practice problems in ${weakest.subject}. Clarify doubts with professors or study groups.` },
        { week: 'Week 3', task: `Take a full mock test for ${weakest.subject}. Continue reviewing other subjects in parallel.` },
        { week: 'Week 4', task: 'Comprehensive revision across all subjects. Focus on time management during exams.' }
      ];
    }
  }

  return roadmap;
}

// =============================================
// ROUTES — Try Flask first, fallback to local
// =============================================

// @desc    Get AI Smart Insights
// @route   GET /api/ai/insights
router.get('/insights', protect, async (req, res) => {
  try {
    const marks = await SubjectMark.find({ user: req.user.id }).sort({ date: 1 });
    
    try {
      const response = await axios.post(`${FLASK_URL}/smart-insights`, { marks }, { timeout: 3000 });
      return res.json(response.data);
    } catch (flaskErr) {
      console.warn('⚠️ Flask unavailable for /insights, using local fallback');
      const insights = generateLocalInsights(marks);
      return res.json({ insights });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get AI Recommendations
// @route   GET /api/ai/recommendations
router.get('/recommendations', protect, async (req, res) => {
  try {
    const marks = await SubjectMark.find({ user: req.user.id });
    
    try {
      const response = await axios.post(`${FLASK_URL}/recommendations`, { marks }, { timeout: 3000 });
      return res.json(response.data);
    } catch (flaskErr) {
      console.warn('⚠️ Flask unavailable for /recommendations, using local fallback');
      const recommendations = generateLocalRecommendations(marks);
      return res.json({ recommendations });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get study roadmap
// @route   GET /api/ai/roadmap
router.get('/roadmap', protect, async (req, res) => {
  try {
    const marks = await SubjectMark.find({ user: req.user.id });
    
    try {
      const response = await axios.post(`${FLASK_URL}/study-roadmap`, { marks }, { timeout: 3000 });
      return res.json(response.data);
    } catch (flaskErr) {
      console.warn('⚠️ Flask unavailable for /roadmap, using local fallback');
      const roadmap = generateLocalRoadmap(marks);
      return res.json({ roadmap });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
