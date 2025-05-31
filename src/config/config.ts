import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/digiwallet',
  jwtSecret: process.env.JWT_SECRET || 'default_secret_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  // Fraud detection settings
  fraudDetection: {
    maxTransfersPerHour: 10,
    largeTransactionThreshold: 1000, // Amount considered "large"
    suspiciousWithdrawalThreshold: 0.8, // 80% of balance withdrawn at once is suspicious
  }
};

export default config;
