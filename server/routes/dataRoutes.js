const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const {
  addMark,
  uploadCsv,
  getMarks,
  deleteMark
} = require('../controllers/dataController');

// Multer memory storage configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.route('/mark').post(protect, addMark);
router.route('/upload-csv').post(protect, upload.single('file'), uploadCsv);
router.route('/marks').get(protect, getMarks);
router.route('/mark/:id').delete(protect, deleteMark);

module.exports = router;
