import ApiError from '../utils/ApiError.js';

const errorHandler = (err, req, res, next) => {
	// В тестах не засоряем вывод логами ожидаемых ошибок
	if (process.env.NODE_ENV !== 'test') {
		console.error('=== ОШИБКА НА СЕРВЕРЕ ===');
		console.error('Метод и путь:', req.method, req.originalUrl);
		console.error('Сообщение:', err.message);
		if (err.stack) console.error('Stack:', err.stack);
		console.error('===========================');
	}

	if (err instanceof ApiError) {
		return res.status(err.statusCode).json({ success: false, message: err.message });
	}

	// Ошибки разбора тела запроса относятся к клиенту, а не к серверу
	if (err.type === 'entity.parse.failed') {
		return res.status(400).json({ success: false, message: 'Некорректный JSON в теле запроса' });
	}
	if (err.type === 'entity.too.large') {
		return res.status(413).json({ success: false, message: 'Слишком большой запрос' });
	}

	res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
};

export default errorHandler;
