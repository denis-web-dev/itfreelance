import { z } from 'zod';

export const registerSchema = z.object({
	email: z.string().email('Некорректный email'),
	password: z
		.string()
		.min(6, 'Пароль должен быть не менее 6 символов')
		.regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву')
		.regex(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру'),
	role: z.enum(['FREELANCER', 'CUSTOMER'], {
		errorMap: () => ({ message: 'Роль должна быть FREELANCER или CUSTOMER' }),
	}),
	fullName: z.string().min(2, 'Имя должно содержать минимум 2 символа').optional(),
});

export const loginSchema = z.object({
	email: z.string().email('Некорректный email'),
	password: z.string().min(1, 'Введите пароль'),
});

export const refreshSchema = z.object({
	refreshToken: z.string().min(1, 'Refresh token обязателен'),
});
