const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./db');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const dataRoutes = require('./routes/dataRoutes');
const goalRoutes = require('./routes/goalRoutes');
const aiRoutes = require('./routes/aiRoutes');
const seedRoutes = require('./routes/seedRoutes');
const leetcodeRoutes = require('./routes/leetcodeRoutes');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/leetcode', leetcodeRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('Student Growth API is running...');
});

// Start the server
const PORT = process.env.PORT || 10000;

const startServer = async () => {
  const isDbConnected = await connectDB();
  if (!isDbConnected) {
    console.warn('Running without database connection.');
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
