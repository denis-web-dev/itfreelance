import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 минут
	max: 10, // максимум 10 попыток регистрации/логина
	message: {
		success: false,
		message: 'Слишком много попыток. Попробуйте позже.',
	},
	standardHeaders: true,
	legacyHeaders: false,
});
