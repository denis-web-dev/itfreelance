import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	skip: () => process.env.NODE_ENV === 'test', // в тестах лимит отключён
	message: { success: false, message: 'Слишком много попыток. Попробуйте позже.' },
});
