const Goal = require('../models/Goal');
const Gamification = require('../models/Gamification');
const axios = require('axios');
const { LeetCode } = require('leetcode-query');

const lc = new LeetCode();

// Helper to calculate days between two dates
const getDaysDifference = (date1, date2) => {
  const d1 = new Date(date1).setHours(0,0,0,0);
  const d2 = new Date(date2).setHours(0,0,0,0);
  return Math.round((d1 - d2) / (1000 * 60 * 60 * 24));
};

// Helper to calculate streak from submission calendar
const getStreak = (data) => {
  const dates = Object.keys(data)
    .map(ts => Number(ts))
    .sort((a, b) => b - a);

  let streak = 0;
  let current = Math.floor(Date.now() / 1000);

  for (let ts of dates) {
    if (Math.abs(current - ts) <= 86400) {
      streak++;
      current = ts - 86400;
    } else break;
  }
  return streak;
};

// Helper to check for activity on a specific day
const checkActivity = (data, timestampOffset) => {
  const target = Math.floor(Date.now() / 1000) - (timestampOffset * 86400);
  const foundKey = Object.keys(data).find(ts => Math.abs(Number(ts) - target) < 86400);
  return !!foundKey;
};

// @desc    Get goals and gamification info
// @route   GET /api/goals
// @access  Private
const getGoalsData = async (req, res) => {
  try {
    let goals = await Goal.find({ user: req.user.id }).sort({ createdAt: -1 });
    
    // --- Live Sync Coding Goals ---
    let updatedAny = false;
    for (let goal of goals) {
      if (goal.type === 'coding' && goal.codingDetails?.platform === 'leetcode' && goal.status === 'in-progress') {
        try {
          const userObj = await lc.user(goal.codingDetails.username);
          if (userObj && userObj.matchedUser) {
            const stats = userObj.matchedUser.submitStats.acSubmissionNum;
            const calendarJson = userObj.matchedUser.userCalendar.submissionCalendar;
            const calendar = JSON.parse(calendarJson);

            const liveTotal = stats[0].count;
            const liveEasy = stats[1].count;
            const liveMedium = stats[2].count;
            const liveHard = stats[3].count;

            const previousTotal = goal.codingDetails.currentProblemsSolved || 0;

            // Updated Streak and Daily activity
            goal.codingDetails.currentStreak = getStreak(calendar);
            goal.codingDetails.solvedToday = checkActivity(calendar, 0);
            goal.codingDetails.solvedYesterday = checkActivity(calendar, 1);
            
            // Calculate problems solved today from calendar directly (most accurate)
            const todayStartTs = Math.floor(new Date().setHours(0,0,0,0) / 1000);
            const todaySolveCount = calendar[todayStartTs.toString()] || 0;
            goal.codingDetails.problemsSolvedToday = todaySolveCount;

            // Yesterday solve count
            const yesterdayStartTs = todayStartTs - 86400;
            const yesterdaySolveCount = calendar[yesterdayStartTs.toString()] || 0;
            goal.codingDetails.problemsSolvedYesterday = yesterdaySolveCount;
            
            goal.codingDetails.currentProblemsSolved = liveTotal;
            goal.codingDetails.easySolved = liveEasy;
            goal.codingDetails.mediumSolved = liveMedium;
            goal.codingDetails.hardSolved = liveHard;
            goal.codingDetails.lastCheckedDate = new Date();
            
            // Automatically mark completed if target reached
            if (goal.codingDetails.currentProblemsSolved - goal.codingDetails.startingProblemsSolved >= goal.codingDetails.targetProblems) {
               goal.status = 'completed';
            }
            
            await goal.save();
            updatedAny = true;
          }
        } catch (err) {
          console.error(`LeetCode sync failed for ${goal.codingDetails.username}`, err.message);
        }
      }
    }

    if (updatedAny) {
      goals = await Goal.find({ user: req.user.id }).sort({ createdAt: -1 });
    }

    let gamification = await Gamification.findOne({ user: req.user.id });
    if (!gamification) {
      gamification = await Gamification.create({ user: req.user.id, points: 0, badges: [], currentLevel: 1 });
    }

    res.json({ goals, gamification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add new goal
// @route   POST /api/goals
// @access  Private
const addGoal = async (req, res) => {
  try {
    const { title, type, targetPercentage, deadline, projectDetails, codingDetails } = req.body;
    
    let goalData = {
      user: req.user.id,
      title,
      type: type || 'academic',
      deadline
    };

    if (goalData.type === 'academic') {
      goalData.targetPercentage = targetPercentage;
    } else if (goalData.type === 'project') {
      goalData.projectDetails = projectDetails;
    } else if (goalData.type === 'coding') {
      if (codingDetails.platform === 'leetcode') {
        try {
          const userObj = await lc.user(codingDetails.username);
          if (userObj && userObj.matchedUser) {
            const stats = userObj.matchedUser.submitStats.acSubmissionNum;
            codingDetails.startingProblemsSolved = stats[0].count || 0;
            codingDetails.currentProblemsSolved = codingDetails.startingProblemsSolved;
            
            codingDetails.easySolved = stats[1].count || 0;
            codingDetails.mediumSolved = stats[2].count || 0;
            codingDetails.hardSolved = stats[3].count || 0;

            codingDetails.lastCheckedDate = new Date();
            codingDetails.problemsSolvedToday = 0;
            codingDetails.problemsSolvedYesterday = 0;
          }
        } catch (err) {
          console.error('Initial LeetCode fetch failed', err.message);
          codingDetails.startingProblemsSolved = 0;
          codingDetails.currentProblemsSolved = 0;
        }
      }
      goalData.codingDetails = codingDetails;
    }

    const goal = await Goal.create(goalData);
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update goal
// @route   PUT /api/goals/:id
// @access  Private
const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    if (goal.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    const { currentPercentage, status } = req.body;
    
    // Support legacy/academic mapping
    if (currentPercentage !== undefined) {
      goal.currentPercentage = currentPercentage;
    }
    
    if (status) {
      goal.status = status;
    }

    const updatedGoal = await goal.save();
    
    // Reward points for completion
    if (status === 'completed') {
       let xpReward = 200; // Base academic reward
       if (goal.type === 'project') xpReward = 500;
       if (goal.type === 'coding') xpReward = 400;

       await Gamification.findOneAndUpdate(
         { user: req.user.id },
         { $inc: { points: xpReward } },
         { upsert: true }
       );
    }
    
    res.json(updatedGoal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteGoal = async (req, res) => {
  try {
     const goal = await Goal.findById(req.params.id);
     if (!goal) return res.status(404).json({ message: 'Goal not found' });
     if (goal.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
     await goal.deleteOne();
     res.json({ message: 'Goal removed '} );
  } catch(error) {
     res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getGoalsData,
  addGoal,
  updateGoal,
  deleteGoal
};
