import { Router } from 'express';
import { body } from 'express-validator';
import { uploadImage } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
router.use(authenticate);
router.post('/images', body('dataUrl').isString().isLength({ min: 20, max: 3_000_000 }), validate, uploadImage);

export default router;
