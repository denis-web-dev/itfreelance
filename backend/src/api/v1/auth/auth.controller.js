import * as authService from './auth.service.js';

export const register = async (req, res, next) => {
	try {
		const result = await authService.registerUser(req.body);
		res.status(201).json({
			success: true,
			message: 'Регистрация прошла успешно',
			data: { user: result.user, tokens: result.tokens },
		});
	} catch (error) {
		next(error);
	}
};
