import ApiError from '../utils/ApiError.js';

const errorHandler = (err, req, res, next) => {
	console.error('=== ОШИБКА НА СЕРВЕРЕ ===');
	console.error('Метод и путь:', req.method, req.originalUrl);
	console.error('Тело запроса:', req.body);
	console.error('Сообщение:', err.message);
	if (err.stack) console.error('Stack:', err.stack);
	console.error('===========================');

	if (err instanceof ApiError) {
		return res.status(err.statusCode).json({ success: false, message: err.message });
	}

	res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
};

export default errorHandler;
