import { Router } from 'express';
import { body, param } from 'express-validator';
import * as userController from '../controllers/user.controller';
import * as profileController from '../controllers/profile.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
router.use(authenticate);

router.get('/me/profile', profileController.getProfile);
router.patch('/me/profile', [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('avatar').optional({ nullable: true }).isURL(),
  body('level').optional().isIn(['A0', 'A1', 'A2', 'B1', 'B2', 'C1']),
  body('learningGoal').optional().isIn(['conversation', 'work', 'travel', 'exam', 'general']),
  body('dailyGoal').optional().isInt({ min: 5, max: 60 }),
  body('timezone').optional().isLength({ min: 1, max: 100 }),
  body('bio').optional().isLength({ max: 300 }),
  body('onboardingCompleted').optional().isBoolean(),
], validate, profileController.updateProfile);

router.post('/', authorize('admin'), [
  body('name').trim().notEmpty(), body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }), body('role').optional().isIn(['user', 'instructor', 'admin']),
], validate, userController.create);
router.get('/', authorize('admin'), userController.getAll);
router.get('/:id', authorize('admin'), param('id').isMongoId(), validate, userController.getOne);
router.patch('/:id', authorize('admin'), [
  param('id').isMongoId(), body('name').optional().trim().notEmpty(), body('avatar').optional().isURL(),
], validate, userController.update);
router.delete('/:id', authorize('admin'), param('id').isMongoId(), validate, userController.remove);

export default router;
