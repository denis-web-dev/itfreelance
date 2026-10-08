import { verifyAccessToken } from '../config/jwt.config.js';
import ApiError from '../utils/ApiError.js';

export const protect = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader?.startsWith('Bearer ')) {
		return next(ApiError.unauthorized('Токен не предоставлен'));
	}
	try {
		const decoded = verifyAccessToken(authHeader.split(' ')[1]);
		req.user = { id: decoded.userId, role: decoded.role };
		next();
	} catch {
		next(ApiError.unauthorized('Неверный или просроченный токен'));
	}
};

// Права на каждом эндпоинте: router.post('/jobs', protect, requireRole('CUSTOMER'), ...)
export const requireRole =
	(...roles) =>
	(req, res, next) =>
		roles.includes(req.user?.role) ? next() : next(ApiError.forbidden('Недостаточно прав'));
