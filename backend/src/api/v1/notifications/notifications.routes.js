import { Router } from 'express';
import { protect } from '../../../middleware/auth.js';
import { validateQuery } from '../../../middleware/validate.js';
import { listNotificationsQuerySchema } from '../../../schemas/notification.schema.js';
import * as notificationsController from './notifications.controller.js';

const router = Router();

// Уведомления есть у любого вошедшего пользователя, и каждый видит только свои
router.use(protect);

router.get('/', validateQuery(listNotificationsQuerySchema), notificationsController.list);
router.post('/read-all', notificationsController.readAll);
router.post('/:id/read', notificationsController.read);

export default router;
