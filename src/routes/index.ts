import { Router } from 'express';
import adminRoutes from './admin.routes';
import authRoutes from './auth.routes';
import learningRoutes from './learning.routes';
import userRoutes from './user.routes';

export const router = Router();

router.use('/admin', adminRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/learning', learningRoutes);


