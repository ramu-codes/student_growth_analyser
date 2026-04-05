/**
 * Seed script for user: ramucodes@gmail.com
 * Run with: node scripts/seedRealData.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const SubjectMark = require('../models/SubjectMark');
const Goal = require('../models/Goal');
const Gamification = require('../models/Gamification');

const MONGO_URI = process.env.MONGO_URI;

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // --- Find or create user ---
    let user = await User.findOne({ email: 'ramucodes@gmail.com' });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('rrrrrr', salt);
      user = await User.create({
        name: 'Ramu',
        email: 'ramucodes@gmail.com',
        password: hashedPassword,
      });
      console.log('👤 User created');
    } else {
      console.log('👤 User found:', user.name);
    }

    const userId = user._id;

    // --- Clear existing data ---
    await SubjectMark.deleteMany({ user: userId });
    await Goal.deleteMany({ user: userId });
    console.log('🗑️ Cleared old marks and goals');

    // ============================================
    // ALL SEMESTER MARKS
    // ============================================
    const allMarks = [
      // --- SEMESTER 1 ---
      { subject: 'Engineering Physics', examType: 'mid', score: 24, maxScore: 30, semester: 'Sem 1', attendancePercentage: 82 },
      { subject: 'Engineering Physics', examType: 'end', score: 51, maxScore: 70, semester: 'Sem 1', attendancePercentage: 82 },
      { subject: 'Engineering Mathematics-I', examType: 'mid', score: 24, maxScore: 30, semester: 'Sem 1', attendancePercentage: 85 },
      { subject: 'Engineering Mathematics-I', examType: 'end', score: 48, maxScore: 70, semester: 'Sem 1', attendancePercentage: 85 },
      { subject: 'Fundamentals of Electrical Engineering', examType: 'mid', score: 24, maxScore: 30, semester: 'Sem 1', attendancePercentage: 88 },
      { subject: 'Fundamentals of Electrical Engineering', examType: 'end', score: 55, maxScore: 70, semester: 'Sem 1', attendancePercentage: 88 },
      { subject: 'Programming for Problem Solving', examType: 'mid', score: 24, maxScore: 30, semester: 'Sem 1', attendancePercentage: 90 },
      { subject: 'Programming for Problem Solving', examType: 'end', score: 47, maxScore: 70, semester: 'Sem 1', attendancePercentage: 90 },
      { subject: 'Environment and Ecology', examType: 'mid', score: 27, maxScore: 30, semester: 'Sem 1', attendancePercentage: 86 },
      { subject: 'Environment and Ecology', examType: 'end', score: 48, maxScore: 70, semester: 'Sem 1', attendancePercentage: 86 },
      // Sem 1 Labs
      { subject: 'Physics Lab', examType: 'mid', score: 47, maxScore: 50, semester: 'Sem 1', attendancePercentage: 95 },
      { subject: 'Physics Lab', examType: 'end', score: 46, maxScore: 50, semester: 'Sem 1', attendancePercentage: 95 },
      { subject: 'Electrical Lab', examType: 'mid', score: 47, maxScore: 50, semester: 'Sem 1', attendancePercentage: 94 },
      { subject: 'Electrical Lab', examType: 'end', score: 45, maxScore: 50, semester: 'Sem 1', attendancePercentage: 94 },
      { subject: 'Programming Lab', examType: 'mid', score: 42, maxScore: 50, semester: 'Sem 1', attendancePercentage: 92 },
      { subject: 'Programming Lab', examType: 'end', score: 45, maxScore: 50, semester: 'Sem 1', attendancePercentage: 92 },
      { subject: 'Graphics Lab', examType: 'mid', score: 44, maxScore: 50, semester: 'Sem 1', attendancePercentage: 90 },
      { subject: 'Graphics Lab', examType: 'end', score: 42, maxScore: 50, semester: 'Sem 1', attendancePercentage: 90 },

      // --- SEMESTER 2 ---
      { subject: 'Engineering Chemistry', examType: 'mid', score: 28, maxScore: 30, semester: 'Sem 2', attendancePercentage: 88 },
      { subject: 'Engineering Chemistry', examType: 'end', score: 62, maxScore: 70, semester: 'Sem 2', attendancePercentage: 88 },
      { subject: 'Mathematics-II', examType: 'mid', score: 26, maxScore: 30, semester: 'Sem 2', attendancePercentage: 84 },
      { subject: 'Mathematics-II', examType: 'end', score: 52, maxScore: 70, semester: 'Sem 2', attendancePercentage: 84 },
      { subject: 'Electronics Engineering', examType: 'mid', score: 27, maxScore: 30, semester: 'Sem 2', attendancePercentage: 82 },
      { subject: 'Electronics Engineering', examType: 'end', score: 48, maxScore: 70, semester: 'Sem 2', attendancePercentage: 82 },
      { subject: 'Mechanical Engineering', examType: 'mid', score: 29, maxScore: 30, semester: 'Sem 2', attendancePercentage: 86 },
      { subject: 'Mechanical Engineering', examType: 'end', score: 54, maxScore: 70, semester: 'Sem 2', attendancePercentage: 86 },
      { subject: 'Soft Skills', examType: 'mid', score: 27, maxScore: 30, semester: 'Sem 2', attendancePercentage: 90 },
      { subject: 'Soft Skills', examType: 'end', score: 52, maxScore: 70, semester: 'Sem 2', attendancePercentage: 90 },
      // Sem 2 Labs
      { subject: 'Chemistry Lab', examType: 'mid', score: 44, maxScore: 50, semester: 'Sem 2', attendancePercentage: 92 },
      { subject: 'Chemistry Lab', examType: 'end', score: 45, maxScore: 50, semester: 'Sem 2', attendancePercentage: 92 },
      { subject: 'Electronics Lab', examType: 'mid', score: 48, maxScore: 50, semester: 'Sem 2', attendancePercentage: 95 },
      { subject: 'Electronics Lab', examType: 'end', score: 45, maxScore: 50, semester: 'Sem 2', attendancePercentage: 95 },
      { subject: 'English Lab', examType: 'mid', score: 48, maxScore: 50, semester: 'Sem 2', attendancePercentage: 94 },
      { subject: 'English Lab', examType: 'end', score: 44, maxScore: 50, semester: 'Sem 2', attendancePercentage: 94 },
      { subject: 'Workshop Lab', examType: 'mid', score: 49, maxScore: 50, semester: 'Sem 2', attendancePercentage: 96 },
      { subject: 'Workshop Lab', examType: 'end', score: 45, maxScore: 50, semester: 'Sem 2', attendancePercentage: 96 },
      { subject: 'Sports & Yoga', examType: 'end', score: 93, maxScore: 100, semester: 'Sem 2', attendancePercentage: 98 },

      // --- SEMESTER 3 ---
      { subject: 'Energy Science', examType: 'mid', score: 24, maxScore: 30, semester: 'Sem 3', attendancePercentage: 80 },
      { subject: 'Energy Science', examType: 'end', score: 55, maxScore: 70, semester: 'Sem 3', attendancePercentage: 80 },
      { subject: 'Technical Communication', examType: 'mid', score: 25, maxScore: 30, semester: 'Sem 3', attendancePercentage: 78 },
      { subject: 'Technical Communication', examType: 'end', score: 46, maxScore: 70, semester: 'Sem 3', attendancePercentage: 78 },
      { subject: 'Data Structure', examType: 'mid', score: 23, maxScore: 30, semester: 'Sem 3', attendancePercentage: 82 },
      { subject: 'Data Structure', examType: 'end', score: 55, maxScore: 70, semester: 'Sem 3', attendancePercentage: 82 },
      { subject: 'Computer Organization & Architecture', examType: 'mid', score: 24, maxScore: 30, semester: 'Sem 3', attendancePercentage: 79 },
      { subject: 'Computer Organization & Architecture', examType: 'end', score: 50, maxScore: 70, semester: 'Sem 3', attendancePercentage: 79 },
      { subject: 'Discrete Structures', examType: 'mid', score: 25, maxScore: 30, semester: 'Sem 3', attendancePercentage: 76 },
      { subject: 'Discrete Structures', examType: 'end', score: 42, maxScore: 70, semester: 'Sem 3', attendancePercentage: 76 },
      { subject: 'Cyber Security', examType: 'mid', score: 23, maxScore: 30, semester: 'Sem 3', attendancePercentage: 74 },
      { subject: 'Cyber Security', examType: 'end', score: 41, maxScore: 70, semester: 'Sem 3', attendancePercentage: 74 },
      // Sem 3 Labs
      { subject: 'DS Lab', examType: 'mid', score: 39, maxScore: 50, semester: 'Sem 3', attendancePercentage: 90 },
      { subject: 'DS Lab', examType: 'end', score: 50, maxScore: 50, semester: 'Sem 3', attendancePercentage: 90 },
      { subject: 'COA Lab', examType: 'mid', score: 50, maxScore: 50, semester: 'Sem 3', attendancePercentage: 96 },
      { subject: 'COA Lab', examType: 'end', score: 49, maxScore: 50, semester: 'Sem 3', attendancePercentage: 96 },
      { subject: 'Web Workshop', examType: 'mid', score: 47, maxScore: 50, semester: 'Sem 3', attendancePercentage: 94 },
      { subject: 'Web Workshop', examType: 'end', score: 46, maxScore: 50, semester: 'Sem 3', attendancePercentage: 94 },
      { subject: 'Internship', examType: 'end', score: 94, maxScore: 100, semester: 'Sem 3', attendancePercentage: 100 },

      // --- SEMESTER 4 ---
      { subject: 'Mathematics-IV', examType: 'mid', score: 24, maxScore: 30, semester: 'Sem 4', attendancePercentage: 72 },
      { subject: 'Mathematics-IV', examType: 'end', score: 28, maxScore: 70, semester: 'Sem 4', attendancePercentage: 72 },
      { subject: 'Human Values', examType: 'mid', score: 25, maxScore: 30, semester: 'Sem 4', attendancePercentage: 80 },
      { subject: 'Human Values', examType: 'end', score: 51, maxScore: 70, semester: 'Sem 4', attendancePercentage: 80 },
      { subject: 'Operating Systems', examType: 'mid', score: 24, maxScore: 30, semester: 'Sem 4', attendancePercentage: 78 },
      { subject: 'Operating Systems', examType: 'end', score: 48, maxScore: 70, semester: 'Sem 4', attendancePercentage: 78 },
      { subject: 'Theory of Computation', examType: 'mid', score: 23, maxScore: 30, semester: 'Sem 4', attendancePercentage: 82 },
      { subject: 'Theory of Computation', examType: 'end', score: 56, maxScore: 70, semester: 'Sem 4', attendancePercentage: 82 },
      { subject: 'Java', examType: 'mid', score: 26, maxScore: 30, semester: 'Sem 4', attendancePercentage: 84 },
      { subject: 'Java', examType: 'end', score: 45, maxScore: 70, semester: 'Sem 4', attendancePercentage: 84 },
      { subject: 'Python', examType: 'mid', score: 24, maxScore: 30, semester: 'Sem 4', attendancePercentage: 80 },
      { subject: 'Python', examType: 'end', score: 47, maxScore: 70, semester: 'Sem 4', attendancePercentage: 80 },
      // Sem 4 Labs
      { subject: 'OS Lab', examType: 'mid', score: 45, maxScore: 50, semester: 'Sem 4', attendancePercentage: 92 },
      { subject: 'OS Lab', examType: 'end', score: 50, maxScore: 50, semester: 'Sem 4', attendancePercentage: 92 },
      { subject: 'Java Lab', examType: 'mid', score: 49, maxScore: 50, semester: 'Sem 4', attendancePercentage: 96 },
      { subject: 'Java Lab', examType: 'end', score: 49, maxScore: 50, semester: 'Sem 4', attendancePercentage: 96 },
      { subject: 'Cyber Security Lab', examType: 'mid', score: 50, maxScore: 50, semester: 'Sem 4', attendancePercentage: 98 },
      { subject: 'Cyber Security Lab', examType: 'end', score: 50, maxScore: 50, semester: 'Sem 4', attendancePercentage: 98 },
      { subject: 'Sports II', examType: 'end', score: 95, maxScore: 100, semester: 'Sem 4', attendancePercentage: 100 },

      // --- SEMESTER 5 ---
      { subject: 'DBMS', examType: 'mid', score: 24, maxScore: 30, semester: 'Sem 5', attendancePercentage: 75 },
      { subject: 'DBMS', examType: 'end', score: 33, maxScore: 70, semester: 'Sem 5', attendancePercentage: 75 },
      { subject: 'Data Analytics', examType: 'mid', score: 24, maxScore: 30, semester: 'Sem 5', attendancePercentage: 78 },
      { subject: 'Data Analytics', examType: 'end', score: 46, maxScore: 70, semester: 'Sem 5', attendancePercentage: 78 },
      { subject: 'Analysis of Algorithm', examType: 'mid', score: 27, maxScore: 30, semester: 'Sem 5', attendancePercentage: 72 },
      { subject: 'Analysis of Algorithm', examType: 'end', score: 25, maxScore: 70, semester: 'Sem 5', attendancePercentage: 72 },
      { subject: 'Data Warehouse & Mining', examType: 'mid', score: 24, maxScore: 30, semester: 'Sem 5', attendancePercentage: 80 },
      { subject: 'Data Warehouse & Mining', examType: 'end', score: 51, maxScore: 70, semester: 'Sem 5', attendancePercentage: 80 },
      { subject: 'Cloud Computing', examType: 'mid', score: 24, maxScore: 30, semester: 'Sem 5', attendancePercentage: 76 },
      { subject: 'Cloud Computing', examType: 'end', score: 38, maxScore: 70, semester: 'Sem 5', attendancePercentage: 76 },
      // Sem 5 Labs
      { subject: 'DBMS Lab', examType: 'mid', score: 46, maxScore: 50, semester: 'Sem 5', attendancePercentage: 90 },
      { subject: 'DBMS Lab', examType: 'end', score: 46, maxScore: 50, semester: 'Sem 5', attendancePercentage: 90 },
      { subject: 'Data Analytics Lab', examType: 'mid', score: 41, maxScore: 50, semester: 'Sem 5', attendancePercentage: 88 },
      { subject: 'Data Analytics Lab', examType: 'end', score: 46, maxScore: 50, semester: 'Sem 5', attendancePercentage: 88 },
      { subject: 'DAA Lab', examType: 'mid', score: 45, maxScore: 50, semester: 'Sem 5', attendancePercentage: 86 },
      { subject: 'DAA Lab', examType: 'end', score: 47, maxScore: 50, semester: 'Sem 5', attendancePercentage: 86 },
      { subject: 'Mini Project', examType: 'end', score: 83, maxScore: 100, semester: 'Sem 5', attendancePercentage: 95 },
      { subject: 'Constitution of India', examType: 'mid', score: 24, maxScore: 30, semester: 'Sem 5', attendancePercentage: 82 },
      { subject: 'Constitution of India', examType: 'end', score: 51, maxScore: 70, semester: 'Sem 5', attendancePercentage: 82 },
    ];

    // Insert all marks
    const marksWithUser = allMarks.map(m => ({ ...m, user: userId }));
    await SubjectMark.insertMany(marksWithUser);
    console.log(`📝 Inserted ${marksWithUser.length} marks`);

    // --- Profile with GPA History ---
    await StudentProfile.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        studentId: 'RAMU2024',
        currentYear: 3,
        branch: 'Computer Science & Engineering',
        attendancePercentage: 83,
        gpaHistory: [
          { semester: 'Sem 1', gpa: 8.32 },
          { semester: 'Sem 2', gpa: 8.91 },
          { semester: 'Sem 3', gpa: 8.16 },
          { semester: 'Sem 4', gpa: 7.91 },
          { semester: 'Sem 5', gpa: 7.48 },
        ],
        enrolledSubjects: ['DBMS', 'Data Analytics', 'Analysis of Algorithm', 'Data Warehouse & Mining', 'Cloud Computing'],
        githubUsername: 'ramucodes',
      },
      { upsert: true, new: true }
    );
    console.log('📋 Profile updated with GPA history');

    // --- Goals ---
    await Goal.create([
      { user: userId, title: 'Score 75%+ in DBMS End Sem', targetPercentage: 75, deadline: new Date('2026-05-15'), status: 'in-progress' },
      { user: userId, title: 'Improve Algorithm Analysis score', targetPercentage: 70, deadline: new Date('2026-05-20'), status: 'in-progress' },
      { user: userId, title: 'Maintain 85%+ attendance Sem 6', targetPercentage: 85, deadline: new Date('2026-06-30'), status: 'in-progress' },
      { user: userId, title: 'Complete Mini Project presentation', targetPercentage: 90, deadline: new Date('2026-04-30'), status: 'in-progress' },
      { user: userId, title: 'Get 80%+ in COA Lab', targetPercentage: 80, deadline: new Date('2025-12-15'), status: 'completed', currentPercentage: 99 },
    ]);
    console.log('🎯 Goals created');

    // --- Gamification ---
    await Gamification.findOneAndUpdate(
      { user: userId },
      { 
        user: userId, 
        points: 2450, 
        currentLevel: 3, 
        badges: ['First Mark', 'Semester Warrior', 'Lab Excellence', 'Consistent Logger', '5 Semester Veteran'] 
      },
      { upsert: true, new: true }
    );
    console.log('🎮 Gamification set: 2450 XP, Level 3');

    console.log('\n🎉 ALL DATA SEEDED SUCCESSFULLY!');
    console.log(`   📊 Total marks: ${marksWithUser.length}`);
    console.log('   📈 GPA: 8.32 → 8.91 → 8.16 → 7.91 → 7.48');
    console.log('   🎯 Goals: 5 (4 active, 1 completed)');
    console.log('   🎮 XP: 2450, Level: 3');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedData();
