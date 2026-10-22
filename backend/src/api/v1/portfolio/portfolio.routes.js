import { Router } from 'express';
import { protect, requireRole } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import { uploadImage } from '../../../middleware/upload.js';
import { uploadRateLimiter } from '../../../middleware/rateLimiter.js';
import {
	createPortfolioItemSchema,
	updatePortfolioItemSchema,
} from '../../../schemas/portfolio.schema.js';
import * as portfolioController from './portfolio.controller.js';

const router = Router();

// Портфолио только у исполнителей, и только для вошедших
router.use(protect, requireRole('FREELANCER'));

router.get('/me', portfolioController.listMine);

// Порядок важен: лимит запросов, потом приём файла, потом проверка полей
router.post(
	'/',
	uploadRateLimiter,
	uploadImage('image'),
	validate(createPortfolioItemSchema),
	portfolioController.create,
);
router.patch(
	'/:id',
	uploadRateLimiter,
	uploadImage('image'),
	validate(updatePortfolioItemSchema),
	portfolioController.update,
);
router.delete('/:id', portfolioController.remove);

export default router;
