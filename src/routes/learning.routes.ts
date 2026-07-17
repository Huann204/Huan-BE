import { Router } from 'express';
import { body, param } from 'express-validator';
import * as learningController from '../controllers/learning.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/dashboard', learningController.getDashboard);
router.get('/topics', learningController.getTopics);
router.get(
  '/topics/:slug/words',
  param('slug').trim().isSlug().withMessage('Invalid topic slug'),
  validate,
  learningController.getTopicWords
);
router.get('/review', learningController.getReviewQueue);
router.post(
  '/review',
  [
    body('wordId').isMongoId().withMessage('Invalid word ID'),
    body('rating').isIn(['again', 'hard', 'good']).withMessage('Invalid review rating'),
  ],
  validate,
  learningController.submitReview
);
router.post(
  '/sessions',
  [
    body('correct').isInt({ min: 0 }).withMessage('Correct must be zero or greater'),
    body('total').isInt({ min: 1 }).withMessage('Total must be at least one'),
    body('minutes').optional().isInt({ min: 1, max: 180 }).withMessage('Invalid minutes'),
    body('correct').custom((value, { req }) => {
      if (value > req.body.total) throw new Error('Correct cannot exceed total');
      return true;
    }),
  ],
  validate,
  learningController.completeSession
);
router.patch(
  '/goal',
  body('minutes').isInt({ min: 5, max: 60 }).withMessage('Goal must be between 5 and 60 minutes'),
  validate,
  learningController.setDailyGoal
);
router.get('/progress', learningController.getProgress);

export default router;
