import { Router } from 'express';
import { param } from 'express-validator';
import * as controller from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router(); router.use(authenticate);
router.get('/', controller.list);
router.patch('/read-all', controller.readAll);
router.patch('/:id/read', param('id').isMongoId(), validate, controller.read);
export default router;
