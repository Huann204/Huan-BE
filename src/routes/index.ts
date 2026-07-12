import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';

export const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Add more routes here:
// router.use('/courses', courseRoutes);
