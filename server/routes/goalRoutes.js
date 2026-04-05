const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getGoalsData,
  addGoal,
  updateGoal,
  deleteGoal
} = require('../controllers/goalController');

router.route('/')
  .get(protect, getGoalsData)
  .post(protect, addGoal);

router.route('/:id')
  .put(protect, updateGoal)
  .delete(protect, deleteGoal);

module.exports = router;
