const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const SubjectMark = require('../models/SubjectMark');
const StudentProfile = require('../models/StudentProfile');
const Goal = require('../models/Goal');
const Gamification = require('../models/Gamification');

// @desc    Seed test data for the logged-in user
// @route   POST /api/data/seed
// @access  Private
router.post('/seed', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user already has data
    const existingMarks = await SubjectMark.countDocuments({ user: userId });
    if (existingMarks > 0) {
      return res.status(400).json({ message: 'User already has data. Delete existing marks first or use a fresh account.' });
    }

    // --- 1. Create subject marks (6 subjects × 3 exams = 18 records) ---
    const subjects = [
      { subject: 'Data Structures', scores: [
        { examType: 'mid', score: 38, maxScore: 50, attendance: 88, semester: 'Sem 4' },
        { examType: 'end', score: 72, maxScore: 100, attendance: 85, semester: 'Sem 4' },
        { examType: 'test', score: 18, maxScore: 20, attendance: 90, semester: 'Sem 4' },
      ]},
      { subject: 'DBMS', scores: [
        { examType: 'mid', score: 30, maxScore: 50, attendance: 78, semester: 'Sem 4' },
        { examType: 'end', score: 55, maxScore: 100, attendance: 72, semester: 'Sem 4' },
        { examType: 'assignment', score: 8, maxScore: 10, attendance: 80, semester: 'Sem 4' },
      ]},
      { subject: 'Operating Systems', scores: [
        { examType: 'mid', score: 42, maxScore: 50, attendance: 92, semester: 'Sem 4' },
        { examType: 'end', score: 85, maxScore: 100, attendance: 90, semester: 'Sem 4' },
        { examType: 'test', score: 17, maxScore: 20, attendance: 94, semester: 'Sem 4' },
      ]},
      { subject: 'Computer Networks', scores: [
        { examType: 'mid', score: 35, maxScore: 50, attendance: 82, semester: 'Sem 5' },
        { examType: 'end', score: 68, maxScore: 100, attendance: 80, semester: 'Sem 5' },
        { examType: 'test', score: 14, maxScore: 20, attendance: 85, semester: 'Sem 5' },
      ]},
      { subject: 'Machine Learning', scores: [
        { examType: 'mid', score: 44, maxScore: 50, attendance: 95, semester: 'Sem 5' },
        { examType: 'end', score: 90, maxScore: 100, attendance: 93, semester: 'Sem 5' },
        { examType: 'assignment', score: 9, maxScore: 10, attendance: 96, semester: 'Sem 5' },
      ]},
      { subject: 'Web Development', scores: [
        { examType: 'mid', score: 40, maxScore: 50, attendance: 86, semester: 'Sem 5' },
        { examType: 'end', score: 78, maxScore: 100, attendance: 84, semester: 'Sem 5' },
        { examType: 'assignment', score: 10, maxScore: 10, attendance: 88, semester: 'Sem 5' },
      ]},
    ];

    const marksToInsert = [];
    subjects.forEach(subj => {
      subj.scores.forEach(s => {
        marksToInsert.push({
          user: userId,
          subject: subj.subject,
          examType: s.examType,
          score: s.score,
          maxScore: s.maxScore,
          attendancePercentage: s.attendance,
          semester: s.semester,
        });
      });
    });

    await SubjectMark.insertMany(marksToInsert);

    // --- 2. Create/Update Profile with GPA history ---
    await StudentProfile.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        studentId: 'STU' + userId.toString().slice(-6).toUpperCase(),
        currentYear: 3,
        branch: 'Computer Science',
        attendancePercentage: 86,
        gpaHistory: [
          { semester: 'Sem 1', gpa: 7.2 },
          { semester: 'Sem 2', gpa: 7.8 },
          { semester: 'Sem 3', gpa: 8.1 },
          { semester: 'Sem 4', gpa: 8.4 },
          { semester: 'Sem 5', gpa: 8.7 },
        ],
        enrolledSubjects: ['Data Structures', 'DBMS', 'Operating Systems', 'Computer Networks', 'Machine Learning', 'Web Development'],
      },
      { upsert: true, new: true }
    );

    // --- 3. Create goals ---
    await Goal.create([
      { user: userId, title: 'Get 85% in DBMS End Semester', targetPercentage: 85, deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), status: 'in-progress' },
      { user: userId, title: 'Complete Machine Learning Project', targetPercentage: 90, deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), status: 'in-progress' },
      { user: userId, title: 'Achieve 90% Attendance', targetPercentage: 90, deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), status: 'in-progress' },
      { user: userId, title: 'Score 80+ in DSA Mid Semester', targetPercentage: 80, deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), status: 'completed', currentPercentage: 80 },
    ]);

    // --- 4. Set gamification ---
    await Gamification.findOneAndUpdate(
      { user: userId },
      { user: userId, points: 850, currentLevel: 1, badges: ['First Mark', 'Consistent Logger', 'High Scorer'] },
      { upsert: true, new: true }
    );

    res.json({
      message: '✅ Test data seeded successfully!',
      summary: {
        marks: marksToInsert.length,
        subjects: subjects.length,
        goals: 4,
        xp: 850,
        gpaEntries: 5,
      }
    });

  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
