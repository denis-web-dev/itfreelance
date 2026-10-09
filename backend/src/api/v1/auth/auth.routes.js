import { Router } from 'express';
import { validate } from '../../../middleware/validate.js';
import { registerSchema, loginSchema, refreshSchema } from '../../../schemas/auth.schema.js';
import * as authController from './auth.controller.js';

const router = Router();

// Регистрация
router.post('/register', validate(registerSchema), authController.register);

// Вход
router.post('/login', validate(loginSchema), authController.login);

// Обновление токенов
router.post('/refresh', validate(refreshSchema), authController.refresh);

// Выход
router.post('/logout', authController.logout);

export default router;
