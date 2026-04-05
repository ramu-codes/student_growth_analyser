const axios = require('axios');
const StudentProfile = require('../models/StudentProfile');
const SubjectMark = require('../models/SubjectMark');

const FLASK_URL = process.env.FLASK_URL || 'http://localhost:8000';

// @desc    Get AI-powered growth analysis for the logged-in user
// @route   GET /api/analysis/my-growth
// @access  Private
const getGrowthAnalysis = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    const userMarks = await SubjectMark.find({ user: req.user._id });

    // --- GPA Logic ---
    let currentGpa = 0;
    let gpaHistoryForChart = [];

    if (profile && profile.gpaHistory && profile.gpaHistory.length > 0) {
      profile.gpaHistory.sort((a, b) => a.semester.localeCompare(b.semester));
      currentGpa = profile.gpaHistory[profile.gpaHistory.length - 1].gpa;
      gpaHistoryForChart = profile.gpaHistory.map((item) => ({
        label: item.semester,
        gpa: item.gpa,
      }));
    }

    const featuresForML = {
      gpa: currentGpa || 0,
      attendance: profile?.attendancePercentage || 0,
      marks: userMarks,
    };

    // --- Try Flask ML service, fallback to local calculation ---
    let analysisResult;
    try {
      const mlResponse = await axios.post(`${FLASK_URL}/predict`, featuresForML, { timeout: 3000 });
      analysisResult = mlResponse.data;
    } catch (mlError) {
      console.warn('⚠️ ML service unavailable, using local fallback.');
      
      // LOCAL FALLBACK — calculate growth index from marks data
      let growthIndex = 50; // base score
      let recommendation = 'Start logging your marks to get AI-powered insights!';

      if (userMarks.length > 0) {
        const totalPercentage = userMarks.reduce((acc, m) => {
          return acc + (m.score / m.maxScore) * 100;
        }, 0);
        growthIndex = Math.round(totalPercentage / userMarks.length);
        
        // Generate smart recommendation
        const subjectMap = {};
        userMarks.forEach(m => {
          if (!subjectMap[m.subject]) subjectMap[m.subject] = [];
          subjectMap[m.subject].push((m.score / m.maxScore) * 100);
        });

        const subjectAvgs = Object.entries(subjectMap).map(([subj, scores]) => ({
          subject: subj,
          avg: scores.reduce((a, b) => a + b, 0) / scores.length
        }));

        const weakest = subjectAvgs.reduce((min, s) => s.avg < min.avg ? s : min, subjectAvgs[0]);
        const strongest = subjectAvgs.reduce((max, s) => s.avg > max.avg ? s : max, subjectAvgs[0]);

        if (growthIndex >= 80) {
          recommendation = `Excellent performance! Your strongest subject is ${strongest.subject} (${strongest.avg.toFixed(1)}%). Keep pushing for consistency across all subjects.`;
        } else if (growthIndex >= 60) {
          recommendation = `Good progress! Focus more on ${weakest.subject} (${weakest.avg.toFixed(1)}%) to boost your overall growth index. Allocate extra study time there.`;
        } else {
          recommendation = `Your ${weakest.subject} average is ${weakest.avg.toFixed(1)}%. Start with revising fundamentals in this subject. Consistent daily practice can improve your score by 15-20%.`;
        }
      } else if (currentGpa > 0) {
        growthIndex = Math.round(currentGpa * 10);
        recommendation = `Based on your GPA of ${currentGpa}, you're on track. Add subject-wise marks for detailed AI insights!`;
      }

      analysisResult = { growthIndex, recommendation };
    }

    // --- Return combined response ---
    res.json({
      ...analysisResult,
      gpa: currentGpa,
      attendance: profile?.attendancePercentage || 0,
      gpaHistory: gpaHistoryForChart,
    });

  } catch (error) {
    console.error('❌ Server error in getGrowthAnalysis:', error.message);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
};

// @desc    Get performance trends, rankings, and subject-wise averages
// @route   GET /api/analysis/trends
// @access  Private
const getPerformanceTrends = async (req, res) => {
  try {
    const userId = req.user._id;
    const userMarks = await SubjectMark.find({ user: userId });

    if (userMarks.length === 0) {
      return res.json({
        subjectAverages: [],
        rank: 1,
        totalStudents: 1,
        percentile: 100,
        classAverage: 0,
        overallPercentage: 0
      });
    }

    // Subject-wise averages
    const subjectMap = {};
    userMarks.forEach((m) => {
      if (!subjectMap[m.subject]) {
        subjectMap[m.subject] = { totalScore: 0, totalMax: 0, count: 0 };
      }
      subjectMap[m.subject].totalScore += m.score;
      subjectMap[m.subject].totalMax += m.maxScore;
      subjectMap[m.subject].count += 1;
    });

    const subjectAverages = Object.keys(subjectMap).map(subject => ({
      subject,
      average: ((subjectMap[subject].totalScore / subjectMap[subject].totalMax) * 100).toFixed(2)
    }));

    // Class rankings
    const allMarks = await SubjectMark.find();
    const userTotals = {};
    allMarks.forEach(m => {
      const uid = m.user.toString();
      if (!userTotals[uid]) userTotals[uid] = { score: 0, maxScore: 0 };
      userTotals[uid].score += m.score;
      userTotals[uid].maxScore += m.maxScore;
    });

    const scoresArray = Object.keys(userTotals).map(uid => ({
      userId: uid,
      percentage: userTotals[uid].maxScore > 0 
        ? (userTotals[uid].score / userTotals[uid].maxScore) * 100 
        : 0
    })).sort((a, b) => b.percentage - a.percentage);

    const currentUserScoreObj = scoresArray.find(s => s.userId === userId.toString());
    let rank = scoresArray.findIndex(s => s.userId === userId.toString()) + 1;
    if (rank === 0) rank = 1;

    const totalStudents = scoresArray.length || 1;
    const percentile = totalStudents > 1 && currentUserScoreObj
      ? (((totalStudents - rank) / (totalStudents - 1)) * 100).toFixed(2)
      : 100;

    const classAverage = scoresArray.length > 0
      ? (scoresArray.reduce((acc, curr) => acc + curr.percentage, 0) / scoresArray.length).toFixed(2)
      : 0;

    res.json({
      subjectAverages,
      rank,
      totalStudents,
      percentile,
      classAverage,
      overallPercentage: currentUserScoreObj ? currentUserScoreObj.percentage.toFixed(2) : 0
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get semester-wise breakdown
// @route   GET /api/analysis/semester-breakdown
// @access  Private
const getSemesterBreakdown = async (req, res) => {
  try {
    const userId = req.user._id;
    const userMarks = await SubjectMark.find({ user: userId });
    const profile = await StudentProfile.findOne({ user: userId });

    if (userMarks.length === 0) {
      return res.json({ semesters: [] });
    }

    const semMap = {};
    
    // Group marks by semester and subject
    userMarks.forEach(m => {
      const sem = m.semester;
      if (!semMap[sem]) {
        semMap[sem] = { subjects: {} };
      }
      
      const subj = m.subject;
      if (!semMap[sem].subjects[subj]) {
        semMap[sem].subjects[subj] = {
          subject: subj,
          midScore: null,
          midMax: null,
          endScore: null,
          endMax: null,
          totalScore: 0,
          totalMax: 0
        };
      }
      
      const subjStats = semMap[sem].subjects[subj];
      subjStats.totalScore += m.score;
      subjStats.totalMax += m.maxScore;
      
      if (m.examType === 'mid') {
        subjStats.midScore = (subjStats.midScore || 0) + m.score;
        subjStats.midMax = (subjStats.midMax || 0) + m.maxScore;
      } else if (m.examType === 'end') {
        subjStats.endScore = (subjStats.endScore || 0) + m.score;
        subjStats.endMax = (subjStats.endMax || 0) + m.maxScore;
      }
    });

    const semesters = Object.keys(semMap).map(semKey => {
      const subjVals = Object.values(semMap[semKey].subjects);
      let semTotalScore = 0;
      let semTotalMax = 0;
      
      const subjectDetails = subjVals.map(s => {
        semTotalScore += s.totalScore;
        semTotalMax += s.totalMax;
        return {
          ...s,
          average: s.totalMax > 0 ? ((s.totalScore / s.totalMax) * 100).toFixed(2) : 0
        };
      });

      // Find SGPA from profile if available
      let sgpa = 0;
      if (profile && profile.gpaHistory) {
        const historyItem = profile.gpaHistory.find(h => h.semester === semKey);
        if (historyItem) {
          sgpa = historyItem.gpa;
        }
      }

      // Fallback SGPA calculation if not provided (assume 10 points = 100%)
      if (!sgpa && semTotalMax > 0) {
        sgpa = ((semTotalScore / semTotalMax) * 10).toFixed(2);
      }

      return {
        semester: semKey,
        totalScore: semTotalScore,
        totalMax: semTotalMax,
        percentage: semTotalMax > 0 ? (semTotalScore / semTotalMax) * 100 : 0,
        subjectCount: subjectDetails.length,
        sgpa: parseFloat(sgpa),
        subjects: subjectDetails.map(s => s.subject),
        subjectDetails
      };
    });

    // Sort semesters (Sem 1, Sem 2, etc.)
    semesters.sort((a, b) => a.semester.localeCompare(b.semester, undefined, { numeric: true, sensitivity: 'base' }));

    res.json({ semesters });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getGrowthAnalysis,
  getPerformanceTrends,
  getSemesterBreakdown,
};
