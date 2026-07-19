import { Router } from 'express';
import { body, param } from 'express-validator';
import { createWordSet } from '../controllers/ai.controller';
import { sendMessage } from '../controllers/aiTutor.controller';
import * as tools from '../controllers/aiTools.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
router.use(authenticate);
const level = body('level').isIn(['A1', 'A2', 'B1', 'B2', 'C1']);

router.post('/word-sets', [body('topic').trim().isLength({ min: 2, max: 120 }), level, body('count').isInt({ min: 5, max: 30 }), body('notes').optional().trim().isLength({ max: 300 })], validate, createWordSet);
router.post('/tutor/chat', [body('message').trim().isLength({ min: 1, max: 1500 }), body('history').optional().isArray({ max: 10 }), body('history.*.role').optional().isIn(['user', 'assistant']), body('history.*.content').optional().isString().isLength({ min: 1, max: 1500 })], validate, sendMessage);
router.post('/tools/writing', [body('text').trim().isLength({ min: 5, max: 3000 }), body('purpose').optional().trim().isLength({ max: 80 }), level], validate, tools.writing);
router.post('/tools/vocabulary', [body('term').trim().isLength({ min: 1, max: 100 }), body('context').optional().trim().isLength({ max: 500 }), level], validate, tools.vocabulary);
router.post('/tools/exercises', [body('skill').isIn(['vocabulary', 'grammar']), body('topic').trim().isLength({ min: 2, max: 120 }), level, body('count').isInt({ min: 5, max: 10 })], validate, tools.exercises);
router.post('/tools/exercises/:id/submit', [param('id').isMongoId(), body('answers').isArray({ min: 5, max: 10 }), body('answers.*').isInt({ min: 0, max: 3 })], validate, tools.submitExercises);

export default router;
