const crypto = require('crypto');
const SubjectMark = require('../models/SubjectMark');
const StudentProfile = require('../models/StudentProfile');
const Gamification = require('../models/Gamification');
const csv = require('csv-parser');
const stream = require('stream');

// @desc    Add single mark
// @route   POST /api/data/mark
// @access  Private
const addMark = async (req, res) => {
  try {
    const { subject, examType, score, maxScore, attendancePercentage, semester } = req.body;

    const newMark = new SubjectMark({
      user: req.user.id,
      subject,
      examType,
      score,
      maxScore,
      attendancePercentage,
      semester,
    });

    const savedMark = await newMark.save();
    
    // Add logic to update points
    let pointsToAdd = 0;
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) pointsToAdd = 50;
    else if (percentage >= 80) pointsToAdd = 30;
    else if (percentage >= 70) pointsToAdd = 10;
    
    if (pointsToAdd > 0) {
      await Gamification.findOneAndUpdate(
        { user: req.user.id },
        { $inc: { points: pointsToAdd } },
        { upsert: true, new: true }
      );
    }

    res.status(201).json(savedMark);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload CSV bulk marks
// @route   POST /api/data/upload-csv
// @access  Private
const uploadCsv = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        const marksToInsert = results.map((row) => ({
          user: req.user.id,
          subject: row.subject || row.Subject,
          examType: (row.examType || row.ExamType || 'test').toLowerCase(),
          score: Number(row.score || row.Score),
          maxScore: Number(row.maxScore || row.MaxScore || 100),
          attendancePercentage: Number(row.attendance || row.Attendance || 100),
          semester: row.semester || row.Semester || 'Sem 1',
        }));

        const inserted = await SubjectMark.insertMany(marksToInsert);
        
        // Award points for bulk upload
        await Gamification.findOneAndUpdate(
          { user: req.user.id },
          { $inc: { points: 100 } },
          { upsert: true }
        );

        res.status(201).json({ message: `Successfully uploaded ${inserted.length} records.`, inserted });
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get custom marks
// @route   GET /api/data/marks
// @access  Private
const getMarks = async (req, res) => {
  try {
    const marks = await SubjectMark.find({ user: req.user.id }).sort({ date: -1 });
    res.json(marks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a mark entry
// @route   DELETE /api/data/mark/:id
// @access  Private
const deleteMark = async (req, res) => {
  try {
    const mark = await SubjectMark.findById(req.params.id);
    if (!mark) return res.status(404).json({ message: 'Mark not found' });
    if (mark.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    await mark.deleteOne();
    res.json({ message: 'Mark removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addMark,
  uploadCsv,
  getMarks,
  deleteMark
};
