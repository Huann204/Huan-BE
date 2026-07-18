import { Router } from 'express';
import { query } from 'express-validator';
import * as controller from '../controllers/engagement.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
router.use(authenticate);
router.get('/summary', controller.summary);
router.post('/daily-reward', controller.claim);
router.get('/leaderboard', query('period').optional().isIn(['week', 'month', 'all']), validate, controller.leaderboard);
export default router;
