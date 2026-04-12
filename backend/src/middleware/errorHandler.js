import ApiError from '../utils/ApiError.js';

const errorHandler = (err, req, res, next) => {
	// Если это наша кастомная ошибка
	if (err instanceof ApiError) {
		return res.status(err.statusCode).json({
			success: false,
			message: err.message,
		});
	}

	// Неизвестная ошибка (для продакшена скрываем детали)
	console.error(err);
	res.status(500).json({
		success: false,
		message: 'Внутренняя ошибка сервера',
	});
};

export default errorHandler;
