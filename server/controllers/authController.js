const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const generateToken = require('../utils/generateToken');

const inMemoryUsers = new Map();

const isDbConnected = () => mongoose.connection.readyState === 1;

const normalizeEmail = (email = '') => email.trim().toLowerCase();

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!name || !normalizedEmail || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  try {
    if (!isDbConnected()) {
      if (inMemoryUsers.has(normalizedEmail)) {
        return res.status(400).json({ message: 'User already exists (memory mode)' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const memoryUser = {
        _id: randomUUID(),
        name,
        email: normalizedEmail,
        password: hashedPassword,
      };

      inMemoryUsers.set(normalizedEmail, memoryUser);

      const token = generateToken(res, memoryUser._id);
      return res.status(201).json({
        _id: memoryUser._id,
        name: memoryUser.name,
        email: memoryUser.email,
        token,
        mode: 'memory',
      });
    }

    // 1. Check if user already exists
    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 2. Create the new User
    user = new User({
      name,
      email: normalizedEmail,
    });

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 4. Create an associated blank StudentProfile
    const profile = new StudentProfile({
      user: user._id,
      // Set default values
      currentGpa: 0,
      attendancePercentage: 75,
    });

    // 5. Link the profile to the user
    user.profile = profile._id;

    // 6. Save both to the database (in parallel)
    await Promise.all([user.save(), profile.save()]);

    // 7. Generate a token
    const token = generateToken(res, user._id);

    // 8. Send response
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: token,
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    if (!isDbConnected()) {
      const memoryUser = inMemoryUsers.get(normalizedEmail);
      if (!memoryUser) {
        return res.status(400).json({ message: 'Invalid credentials (memory mode)' });
      }

      const isMatch = await bcrypt.compare(password, memoryUser.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials (memory mode)' });
      }

      const token = generateToken(res, memoryUser._id);
      return res.status(200).json({
        _id: memoryUser._id,
        name: memoryUser.name,
        email: memoryUser.email,
        token,
        mode: 'memory',
      });
    }

    // 1. Check if user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 2. Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 3. Generate a token
    const token = generateToken(res, user._id);

    // 4. Send response
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: token,
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

module.exports = {
  registerUser,
  loginUser,
};