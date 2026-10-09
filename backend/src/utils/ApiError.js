class ApiError extends Error {
	constructor(statusCode, message, isOperational = true) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;
		Error.captureStackTrace(this, this.constructor);
	}

	static badRequest(msg) {
		return new ApiError(400, msg);
	}
	static unauthorized(msg = 'Неверный email или пароль') {
		return new ApiError(401, msg);
	}
	static forbidden(msg = 'Недостаточно прав') {
		return new ApiError(403, msg);
	}
	static notFound(msg = 'Не найдено') {
		return new ApiError(404, msg);
	}
	static conflict(msg) {
		return new ApiError(409, msg);
	}
}

export default ApiError;
