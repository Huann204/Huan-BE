import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as controller from '../controllers/wordSet.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
router.use(authenticate);

const id = param('id').isMongoId();
const wordId = param('wordId').isMongoId();
const wordRules = [
  body('word').trim().notEmpty().isLength({ max: 100 }),
  body('meaning.vi').trim().notEmpty().isLength({ max: 200 }),
  body('meaning.en').trim().notEmpty().isLength({ max: 300 }),
  body('imageUrl').optional({ values: 'falsy' }).isURL({ protocols: ['http', 'https'], require_protocol: true }),
];

router.get('/mine', controller.mine);
router.get('/discover', query('q').optional().trim().isLength({ max: 100 }), validate, controller.discover);
router.get('/moderation', authorize('admin'), query('status').optional().isIn(['pending', 'approved', 'rejected']), validate, controller.moderationQueue);
router.patch('/moderation/:id', authorize('admin'), [id, body('action').isIn(['approve', 'reject']), body('note').optional().trim().isLength({ max: 500 })], validate, controller.moderate);
router.post('/', [body('title').trim().notEmpty().isLength({ max: 120 }), body('description').optional().trim().isLength({ max: 500 }), body('visibility').optional().isIn(['private', 'public'])], validate, controller.create);
router.get('/:id', id, validate, controller.detail);
router.patch('/:id', [id, body('title').optional().trim().notEmpty().isLength({ max: 120 }), body('description').optional().trim().isLength({ max: 500 }), body('visibility').optional().isIn(['private', 'public'])], validate, controller.update);
router.delete('/:id', id, validate, controller.remove);
router.post('/:id/copy', id, validate, controller.copy);
router.post('/:id/words', [id, ...wordRules], validate, controller.addWord);
router.patch('/:id/words/:wordId', [id, wordId], validate, controller.updateWord);
router.delete('/:id/words/:wordId', [id, wordId], validate, controller.removeWord);
router.post('/:id/practice', [id, body('mode').isIn(['flashcard', 'quiz']), body('correct').isInt({ min: 0 }), body('total').isInt({ min: 1 }), body('correct').custom((value, { req }) => value <= req.body.total)], validate, controller.completePractice);

export default router;
