import { Router } from 'express';
import { protect, requireRole } from '../../../middleware/auth.js';
import { validate, validateQuery } from '../../../middleware/validate.js';
import {
	createOrderSchema,
	listOrdersQuerySchema,
	updateOrderSchema,
} from '../../../schemas/order.schema.js';
import * as ordersController from './orders.controller.js';

const router = Router();

// Все маршруты заказов только для вошедших пользователей
router.use(protect);

router.get('/', validateQuery(listOrdersQuerySchema), ordersController.list);
router.get('/:id', ordersController.getOne);

// Изменять данные могут только заказчики (а автора заказа проверяет сервис)
router.post('/', requireRole('CUSTOMER'), validate(createOrderSchema), ordersController.create);
router.patch('/:id', requireRole('CUSTOMER'), validate(updateOrderSchema), ordersController.update);
router.post('/:id/cancel', requireRole('CUSTOMER'), ordersController.cancel);

export default router;
