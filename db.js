const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error('MONGO_URL environment variable is not set');
    }
    await mongoose.connect(process.env.MONGO_URL);
    isConnected = true;
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    isConnected = false;
    // Don't exit process, let server run with degraded functionality
    throw err;
  }
};

const getIsConnected = () => isConnected;

module.exports = connectDB;
module.exports.getIsConnected = getIsConnected;