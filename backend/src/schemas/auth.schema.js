import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Некорректный email');

const password = z
	.string()
	.min(8, 'Пароль должен быть не менее 8 символов')
	.max(72, 'Пароль не должен быть длиннее 72 символов')
	.regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву')
	.regex(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру');

export const registerSchema = z.object({
	email,
	password,
	role: z.enum(['FREELANCER', 'CUSTOMER'], { message: 'Выберите роль' }),
	fullName: z.string().trim().min(2, 'Имя должно содержать минимум 2 символа').optional(),
	consent: z.literal(true, { message: 'Необходимо согласие на обработку данных' }),
});

export const loginSchema = z.object({
	email,
	password: z.string().min(1, 'Введите пароль'),
});

export const refreshSchema = z.object({
	refreshToken: z.string().min(1, 'Refresh token обязателен'),
});
