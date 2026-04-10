import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Имя слишком короткое').max(50),
    email: z.string().email('Некорректный email'),
    password: z.string().min(6, 'Пароль минимум 6 символов'),
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
