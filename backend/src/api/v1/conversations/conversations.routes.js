import { Router } from 'express';
import { protect } from '../../../middleware/auth.js';
import { validate, validateQuery } from '../../../middleware/validate.js';
import { messageRateLimiter } from '../../../middleware/rateLimiter.js';
import {
	listMessagesQuerySchema,
	sendMessageSchema,
} from '../../../schemas/conversation.schema.js';
import * as conversationsController from './conversations.controller.js';

const router = Router();

// Чаты есть у любого вошедшего; участие в конкретном чате проверяет сервис
router.use(protect);

router.get('/', conversationsController.list);
router.get('/unread-count', conversationsController.unreadCount); // до '/:id/...'
router.get(
	'/:id/messages',
	validateQuery(listMessagesQuerySchema),
	conversationsController.messages,
);
router.post(
	'/:id/messages',
	messageRateLimiter,
	validate(sendMessageSchema),
	conversationsController.send,
);
router.post('/:id/read', conversationsController.read);

export default router;
