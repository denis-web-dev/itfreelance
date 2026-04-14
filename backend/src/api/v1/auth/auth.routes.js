import { Router } from 'express';
import { registerSchema } from '../../../schemas/auth.schema.js';
import { validate } from '../../../middleware/validate.js';
import { register } from './auth.controller.js';
import { protect } from '../../../middleware/auth.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.get('/me', protect, (req, res) => {
	res.json({ success: true, data: { userId: req.user.id } });
});

export default router;
