import { Router } from 'express';
import { body } from 'express-validator';
import { createWordSet } from '../controllers/ai.controller';
import { sendMessage } from '../controllers/aiTutor.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
router.use(authenticate);

router.post(
  '/word-sets',
  [
    body('topic').trim().isLength({ min: 2, max: 120 }),
    body('level').isIn(['A1', 'A2', 'B1', 'B2', 'C1']),
    body('count').isInt({ min: 5, max: 30 }),
    body('notes').optional().trim().isLength({ max: 300 }),
  ],
  validate,
  createWordSet
);

router.post(
  '/tutor/chat',
  [
    body('message').trim().isLength({ min: 1, max: 1500 }),
    body('history').optional().isArray({ max: 10 }),
    body('history.*.role').optional().isIn(['user', 'assistant']),
    body('history.*.content').optional().isString().isLength({ min: 1, max: 1500 }),
  ],
  validate,
  sendMessage
);

export default router;
