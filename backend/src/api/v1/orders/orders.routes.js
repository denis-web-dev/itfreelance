import { Router } from 'express';
import { protect, requireRole } from '../../../middleware/auth.js';
import { validate, validateQuery } from '../../../middleware/validate.js';
import {
	createOrderSchema,
	listOrdersQuerySchema,
	listFavoritesQuerySchema,
	updateOrderSchema,
} from '../../../schemas/order.schema.js';
import * as ordersController from './orders.controller.js';
import * as favoritesController from './favorites.controller.js';

const router = Router();

router.use(protect);

router.get('/', validateQuery(listOrdersQuerySchema), ordersController.list);

// ВАЖНО: до '/:id', иначе 'favorites' будет принято за id заказа
router.get(
	'/favorites',
	requireRole('FREELANCER'),
	validateQuery(listFavoritesQuerySchema),
	ordersController.listFavorites,
);

router.get('/:id', ordersController.getOne);

router.put('/:id/favorite', requireRole('FREELANCER'), favoritesController.add);
router.delete('/:id/favorite', requireRole('FREELANCER'), favoritesController.remove);

router.post('/', requireRole('CUSTOMER'), validate(createOrderSchema), ordersController.create);
router.patch('/:id', requireRole('CUSTOMER'), validate(updateOrderSchema), ordersController.update);
router.post('/:id/cancel', requireRole('CUSTOMER'), ordersController.cancel);

export default router;
