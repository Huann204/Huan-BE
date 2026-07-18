import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as controller from '../controllers/community.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router(); router.use(authenticate);
router.get('/users', query('q').isString().isLength({ min: 2, max: 50 }), validate, controller.search);
router.get('/friends', controller.network);
router.post('/friends', body('userId').isMongoId(), validate, controller.requestFriend);
router.patch('/friends/:id', [param('id').isMongoId(), body('action').isIn(['accept', 'reject'])], validate, controller.respondFriend);
router.delete('/friends/:id', param('id').isMongoId(), validate, controller.removeFriend);
router.get('/challenges', controller.challenges);
router.post('/challenges', [body('opponentId').isMongoId(), body('targetXp').isInt({ min: 50, max: 5000 })], validate, controller.createChallenge);
router.patch('/challenges/:id', [param('id').isMongoId(), body('action').isIn(['accept', 'decline'])], validate, controller.respondChallenge);
export default router;
