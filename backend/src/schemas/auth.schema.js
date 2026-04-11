import { z } from 'zod';

export const registerSchema = z
	.object({
		name: z.string().min(2, 'Имя должно содержать минимум 2 символа').max(50, 'Имя слишком длинное'),
		email: z.string().email('Введите корректный email'),
		password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Пароли не совпадают',
		path: ['confirmPassword'],
	});

export const loginSchema = z.object({
	email: z.string().email('Некорректный email'),
	password: z.string().min(6, 'Пароль минимум 6 символов'),
});
