import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Приложение в целом', () => {
	it('отвечает JSON-ошибкой 404 на неизвестный маршрут', async () => {
		const res = await request(app).get('/api/v1/unknown');

		expect(res.status).toBe(404);
		expect(res.body).toEqual({ success: false, message: 'Маршрут не найден' });
	});

	it('добавляет защитные заголовки и не раскрывает Express', async () => {
		const res = await request(app).get('/api/v1/unknown');

		expect(res.headers['x-content-type-options']).toBe('nosniff');
		expect(res.headers['x-powered-by']).toBeUndefined();
	});

	it('разрешает CORS для адреса фронтенда', async () => {
		const res = await request(app)
			.options('/api/v1/auth/login')
			.set('Origin', 'http://localhost:5173')
			.set('Access-Control-Request-Method', 'POST');

		expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
	});

	it('не разрешает CORS для чужого адреса', async () => {
		const res = await request(app)
			.options('/api/v1/auth/login')
			.set('Origin', 'https://evil.example')
			.set('Access-Control-Request-Method', 'POST');

		expect(res.headers['access-control-allow-origin']).toBeUndefined();
	});
});
