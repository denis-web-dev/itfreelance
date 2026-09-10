import { z } from 'zod';

export const registerSchema = z.object({
	name: z.string().min(2, 'Имя должно содержать минимум 2 символа').max(50),
	email: z.string().email('Введите корректный email'),
	password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
});

export const loginSchema = z.object({
	email: z.string().email('Некорректный email'),
	password: z.string().min(6, 'Пароль минимум 6 символов'),
});
