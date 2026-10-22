import { verifyAccessToken } from '../config/jwt.config.js';
import prisma from '../lib/prisma.js';
import ApiError from '../utils/ApiError.js';

// Проверяет токен и берёт актуальные данные пользователя из базы:
// заблокированный или удалённый пользователь теряет доступ сразу, а не через 15 минут
export const protect = async (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader?.startsWith('Bearer ')) {
		return next(ApiError.unauthorized('Токен не предоставлен'));
	}

	let decoded;
	try {
		decoded = verifyAccessToken(authHeader.split(' ')[1]);
	} catch {
		return next(ApiError.unauthorized('Неверный или просроченный токен'));
	}

	try {
		const user = await prisma.user.findUnique({
			where: { id: decoded.userId },
			select: { id: true, role: true, isActive: true },
		});
		if (!user || !user.isActive) {
			return next(ApiError.unauthorized('Пользователь не найден или заблокирован'));
		}
		req.user = { id: user.id, role: user.role };
		next();
	} catch (error) {
		next(error);
	}
};

// Права на эндпоинте: router.post('/orders', protect, requireRole('CUSTOMER'), ...)
export const requireRole =
	(...roles) =>
	(req, res, next) =>
		roles.includes(req.user?.role) ? next() : next(ApiError.forbidden('Недостаточно прав'));
