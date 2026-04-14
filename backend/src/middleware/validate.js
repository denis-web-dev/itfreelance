import { ZodError } from 'zod';

export const validate = (schema) => (req, res, next) => {
	try {
		schema.parse(req.body);
		next();
	} catch (error) {
		if (error instanceof ZodError) {
			const issues = error.errors || error.issues || [];
			return res.status(400).json({
				success: false,
				message: 'Ошибка валидации',
				errors: issues.map((err) => ({
					field: err.path.join('.'),
					message: err.message,
				})),
			});
		}
		next(error);
	}
};
