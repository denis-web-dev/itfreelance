import { Router } from 'express';
import { registerSchema } from '../../../schemas/auth.schema.js';
import { validate } from '../../../middleware/validate.js';
import { register } from './auth.controller.js';

const router = Router();

// Версионирование через URI — это ключевой момент для твоей курсовой
router.post('/register', validate(registerSchema), register);

export default router;
