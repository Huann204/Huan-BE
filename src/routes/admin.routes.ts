import { Router } from 'express';
import { body, param } from 'express-validator';
import * as controller from '../controllers/vocabularyAdmin.controller';
import * as grammar from '../controllers/grammarAdmin.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
router.use(authenticate, authorize('admin'));

const optionalImageUrl = body('imageUrl')
  .optional({ values: 'falsy' })
  .isURL({ protocols: ['http', 'https'], require_protocol: true })
  .withMessage('Image URL must be a valid HTTP(S) URL');

router.get('/vocabulary/topics', controller.listContent);
router.post(
  '/vocabulary/topics',
  [
    body('slug').isSlug(),
    body('title.vi').notEmpty(),
    body('title.en').notEmpty(),
    body('description.vi').notEmpty(),
    body('description.en').notEmpty(),
    body('emoji').notEmpty(),
    optionalImageUrl,
  ],
  validate,
  controller.createTopic
);
router.patch('/vocabulary/topics/:id', [param('id').isMongoId(), optionalImageUrl], validate, controller.updateTopic);
router.delete('/vocabulary/topics/:id', param('id').isMongoId(), validate, controller.archiveTopic);
router.get('/vocabulary/topics/:topicId/words', param('topicId').isMongoId(), validate, controller.listWords);
router.post(
  '/vocabulary/words',
  [
    body('topic').isMongoId(),
    body('slug').isSlug(),
    body('word').notEmpty(),
    body('meaning.vi').notEmpty(),
    body('meaning.en').notEmpty(),
    optionalImageUrl,
  ],
  validate,
  controller.createWord
);
router.patch('/vocabulary/words/:id', [param('id').isMongoId(), optionalImageUrl], validate, controller.updateWord);
router.delete('/vocabulary/words/:id', param('id').isMongoId(), validate, controller.archiveWord);
router.post('/vocabulary/import', body('items').isArray({ min: 1, max: 1000 }), validate, controller.importWords);

router.get('/grammar/topics', grammar.topics);
router.post('/grammar/topics', grammar.createTopic);
router.patch('/grammar/topics/:id', param('id').isMongoId(), validate, grammar.updateTopic);
router.delete('/grammar/topics/:id', param('id').isMongoId(), validate, grammar.archiveTopic);
router.get('/grammar/topics/:topicId/exercises', param('topicId').isMongoId(), validate, grammar.exercises);
router.post('/grammar/exercises', grammar.createExercise);
router.patch('/grammar/exercises/:id', param('id').isMongoId(), validate, grammar.updateExercise);
router.delete('/grammar/exercises/:id', param('id').isMongoId(), validate, grammar.archiveExercise);

export default router;
