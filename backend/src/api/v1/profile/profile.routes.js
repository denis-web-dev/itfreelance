import { Router } from 'express';
import { protect } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import { updateProfileSchema } from '../../../schemas/profile.schema.js';
import * as profileController from './profile.controller.js';

const router = Router();

// Все маршруты профиля только для вошедших пользователей
router.use(protect);

router.get('/me', profileController.getMe);
router.put('/me', validate(updateProfileSchema), profileController.updateMe);

export default router;
