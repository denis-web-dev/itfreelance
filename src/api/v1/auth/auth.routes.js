import { Router } from 'express';
import { registerSchema } from '../../../schemas/auth.schema.js';
import { validate } from '../../../middleware/validate.js';
import { register, login } from './auth.controller.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login); // добавим позже

export default router;
