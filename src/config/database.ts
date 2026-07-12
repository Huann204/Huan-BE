import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

// Cache connection across serverless invocations (Vercel/AWS Lambda)
let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected && mongoose.connection.readyState === 1) return;

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    isConnected = false;
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Graceful disconnect
export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
};
