const mongoose = require('mongoose');

const connectWithUri = async (uri) => {
  return mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    family: 4,
  });
};

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const fallbackUri = process.env.MONGO_URI_FALLBACK || 'mongodb://127.0.0.1:27017/student_growth';

  if (!primaryUri) {
    console.error('MONGO_URI is missing in .env');
    return false;
  }

  try {
    const conn = await connectWithUri(primaryUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (primaryError) {
    console.error(`Primary MongoDB connection failed: ${primaryError.message}`);

    if (primaryUri.startsWith('mongodb+srv://')) {
      try {
        const conn = await connectWithUri(fallbackUri);
        console.log(`MongoDB Connected (fallback): ${conn.connection.host}`);
        return true;
      } catch (fallbackError) {
        console.error(`Fallback MongoDB connection failed: ${fallbackError.message}`);
      }
    }

    return false;
  }
};

module.exports = connectDB;