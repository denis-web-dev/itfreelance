import * as authService from './auth.service.js';
import ApiError from '../../utils/ApiError.js';

export const register = async (req, res, next) => {
	try {
		const { name, email, password } = req.body;

		const result = await authService.registerUser({ name, email, password });

		res.status(201).json({
			success: true,
			message: 'Регистрация прошла успешно',
			data: {
				user: result.user,
				tokens: result.tokens,
			},
		});
	} catch (error) {
		next(error); // передаём ошибку в errorHandler (будет позже)
	}
};
