import { ZodError } from 'zod';

const sendValidationError = (res, error) =>
	res.status(400).json({
		success: false,
		message: 'Ошибка валидации',
		errors: (error.issues || []).map((issue) => ({
			field: issue.path.join('.'),
			message: issue.message,
		})),
	});

export const validate = (schema) => (req, res, next) => {
	try {
		req.body = schema.parse(req.body);
		next();
	} catch (error) {
		if (error instanceof ZodError) return sendValidationError(res, error);
		next(error);
	}
};

export const validateQuery = (schema) => (req, res, next) => {
	try {
		req.validatedQuery = schema.parse(req.query);
		next();
	} catch (error) {
		if (error instanceof ZodError) return sendValidationError(res, error);
		next(error);
	}
};
