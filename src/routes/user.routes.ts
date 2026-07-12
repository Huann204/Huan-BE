import { Router } from 'express';
import { body, param } from 'express-validator';
import * as userController from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// ─── Validation rules ─────────────────────────────────────────────────────────
const createValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['user', 'instructor', 'admin']).withMessage('Invalid role'),
];

const updateValidation = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
];

const idValidation = [param('id').isMongoId().withMessage('Invalid user ID')];

// ─── Routes ───────────────────────────────────────────────────────────────────
// Public
router.post('/', createValidation, validate, userController.create);

// Authenticated
router.get('/', authenticate, userController.getAll);
router.get('/:id', authenticate, idValidation, validate, userController.getOne);
router.patch('/:id', authenticate, updateValidation, validate, userController.update);

// Admin only
router.delete('/:id', authenticate, authorize('admin'), idValidation, validate, userController.remove);

export default router;
