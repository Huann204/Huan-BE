import { Router } from 'express';
import adminRoutes from './admin.routes';
import authRoutes from './auth.routes';
import communityRoutes from './community.routes';
import engagementRoutes from './engagement.routes';
import grammarRoutes from './grammar.routes';
import learningRoutes from './learning.routes';
import notificationRoutes from './notification.routes';
import userRoutes from './user.routes';

export const router = Router();

router.use('/admin', adminRoutes);
router.use('/auth', authRoutes);
router.use('/community', communityRoutes);
router.use('/users', userRoutes);
router.use('/grammar', grammarRoutes);
router.use('/learning', learningRoutes);
router.use('/notifications', notificationRoutes);
router.use('/engagement', engagementRoutes);








