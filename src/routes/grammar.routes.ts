import { Router } from 'express';
import { body, param } from 'express-validator';
import * as controller from '../controllers/grammar.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router(); router.use(authenticate);
router.get('/topics', controller.topics);
router.get('/topics/:slug', param('slug').isSlug(), validate, controller.topic);
router.post('/answer', [body('exerciseId').isMongoId(), body('answer').isString().isLength({ min: 1, max: 500 })], validate, controller.answer);
router.get('/mistakes', controller.mistakes);
export default router;
