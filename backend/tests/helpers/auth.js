import request from 'supertest';
import app from '../../src/app.js';

export const PASSWORD = 'Passw0rdX';

// Корректные данные регистрации; поля можно переопределить в конкретном тесте
export const validRegistration = (overrides = {}) => ({
	email: 'ivan@example.com',
	password: PASSWORD,
	role: 'FREELANCER',
	fullName: 'Иван Петров',
	consent: true,
	...overrides,
});

export const register = (overrides) =>
	request(app).post('/api/v1/auth/register').send(validRegistration(overrides));

export const login = (email, password = PASSWORD) =>
	request(app).post('/api/v1/auth/login').send({ email, password });

export const authHeader = (token) => ({ Authorization: `Bearer ${token}` });
