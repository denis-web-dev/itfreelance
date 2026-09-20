import * as authService from './auth.service.js';

/**
 * POST /api/v1/auth/register
 */
export const register = async (req, res, next) => {
	try {
		const result = await authService.registerUser(req.body);
		res.status(201).json({
			success: true,
			message: 'Регистрация прошла успешно',
			data: result,
		});
	} catch (error) {
		next(error);
	}
};

/**
 * POST /api/v1/auth/login
 */
export const login = async (req, res, next) => {
	try {
		const result = await authService.loginUser(req.body);
		res.status(200).json({
			success: true,
			message: 'Вход выполнен успешно',
			data: result,
		});
	} catch (error) {
		next(error);
	}
};

/**
 * POST /api/v1/auth/refresh
 */
export const refresh = async (req, res, next) => {
	try {
		const { refreshToken } = req.body;
		const result = await authService.refreshTokens(refreshToken);
		res.status(200).json({
			success: true,
			data: result,
		});
	} catch (error) {
		next(error);
	}
};

/**
 * POST /api/v1/auth/logout
 */
export const logout = async (req, res, next) => {
	try {
		const { refreshToken } = req.body;
		await authService.logoutUser(refreshToken);
		res.status(200).json({
			success: true,
			message: 'Выход выполнен успешно',
		});
	} catch (error) {
		next(error);
	}
};
