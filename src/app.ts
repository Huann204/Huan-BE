import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Routes
import { router as apiRouter } from './routes/index';

const app: Application = express();

// Trust proxy — required for Vercel/reverse proxy deployments
// Fixes: 'X-Forwarded-For' header validation error from express-rate-limit
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later.',
});
app.use('/api', limiter);

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Ensure DB is connected on every serverless invocation
app.use(async (_req, _res, next) => {
  await connectDB();
  next();
});

// Root
app.get('/', (_req, res) => {
  res.send('Huân');
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV, timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', apiRouter);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

export default app;
