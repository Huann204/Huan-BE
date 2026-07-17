import { Router } from 'express';
import { body, param } from 'express-validator';
import * as controller from '../controllers/vocabularyAdmin.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
router.use(authenticate, authorize('admin'));

router.get('/vocabulary/topics', controller.listContent);
router.post('/vocabulary/topics', [body('slug').isSlug(), body('title.vi').notEmpty(), body('title.en').notEmpty(), body('description.vi').notEmpty(), body('description.en').notEmpty(), body('emoji').notEmpty()], validate, controller.createTopic);
router.patch('/vocabulary/topics/:id', param('id').isMongoId(), validate, controller.updateTopic);
router.delete('/vocabulary/topics/:id', param('id').isMongoId(), validate, controller.archiveTopic);
router.get('/vocabulary/topics/:topicId/words', param('topicId').isMongoId(), validate, controller.listWords);
router.post('/vocabulary/words', [body('topic').isMongoId(), body('slug').isSlug(), body('word').notEmpty(), body('meaning.vi').notEmpty(), body('meaning.en').notEmpty()], validate, controller.createWord);
router.patch('/vocabulary/words/:id', param('id').isMongoId(), validate, controller.updateWord);
router.delete('/vocabulary/words/:id', param('id').isMongoId(), validate, controller.archiveWord);
router.post('/vocabulary/import', body('items').isArray({ min: 1, max: 1000 }), validate, controller.importWords);

export default router;
