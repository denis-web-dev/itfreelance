import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.config.js';
import ApiError from '../utils/ApiError.js';

export const protect = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		throw ApiError.unauthorized('Токен не предоставлен');
	}

	const token = authHeader.split(' ')[1];

	try {
		const decoded = jwt.verify(token, jwtConfig.access.secret);
		req.user = { id: decoded.id };
		next();
	} catch (err) {
		throw ApiError.unauthorized('Неверный или просроченный токен');
	}
};
