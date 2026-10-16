import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma, resetDb } from './helpers/db.js';
import { PASSWORD, login, register } from './helpers/auth.js';

const API = '/api/v1/auth';
const refresh = (refreshToken) => request(app).post(`${API}/refresh`).send({ refreshToken });

beforeEach(resetDb);

describe('POST /register', () => {
	it('создаёт пользователя и профиль, выдаёт токены', async () => {
		const res = await register();

		expect(res.status).toBe(201);
		expect(res.body.success).toBe(true);
		expect(res.body.data.user).toMatchObject({
			email: 'ivan@example.com',
			role: 'FREELANCER',
			fullName: 'Иван Петров',
		});
		expect(res.body.data.tokens.accessToken).toEqual(expect.any(String));
		expect(res.body.data.tokens.refreshToken).toEqual(expect.any(String));

		const user = await prisma.user.findUnique({
			where: { email: 'ivan@example.com' },
			include: { profile: true, refreshTokens: true },
		});
		expect(user.profile.fullName).toBe('Иван Петров');
		expect(user.consentAt).toBeInstanceOf(Date);
		expect(user.refreshTokens).toHaveLength(1);
	});

	it('не хранит пароль в открытом виде и не возвращает хеш', async () => {
		const res = await register();
		const user = await prisma.user.findUnique({ where: { email: 'ivan@example.com' } });

		expect(user.passwordHash).not.toContain(PASSWORD);
		expect(user.passwordHash).toMatch(/^\$2[aby]\$/); // формат bcrypt
		expect(JSON.stringify(res.body)).not.toContain('passwordHash');
		expect(JSON.stringify(res.body)).not.toContain(user.passwordHash);
	});

	it('возвращает 409, если email уже занят', async () => {
		await register();
		const res = await register();

		expect(res.status).toBe(409);
		expect(await prisma.user.count()).toBe(1);
	});

	it('нормализует email: регистр и пробелы не создают дубликат', async () => {
		await register({ email: '  Ivan@Example.com ' });
		const res = await register({ email: 'ivan@example.com' });

		expect(res.status).toBe(409);
		expect(await prisma.user.count()).toBe(1);
	});

	it.each([
		['значение false', { consent: false }],
		['поле не передано', { consent: undefined }],
	])('требует согласие на обработку данных: %s', async (_, overrides) => {
		const res = await register(overrides);

		expect(res.status).toBe(400);
		expect(res.body.errors.map((e) => e.field)).toContain('consent');
		expect(await prisma.user.count()).toBe(0);
	});

	it.each([
		['без цифры', 'Password'],
		['без заглавной буквы', 'passw0rdx'],
		['короче 8 символов', 'Pa1'],
		['длиннее 72 символов', `Aa1${'x'.repeat(70)}`],
	])('отклоняет слабый пароль: %s', async (_, password) => {
		const res = await register({ password });

		expect(res.status).toBe(400);
		expect(res.body.errors.map((e) => e.field)).toContain('password');
		expect(await prisma.user.count()).toBe(0);
	});

	it('отклоняет некорректный email', async () => {
		const res = await register({ email: 'not-an-email' });

		expect(res.status).toBe(400);
		expect(res.body.errors.map((e) => e.field)).toContain('email');
	});

	it('не позволяет зарегистрироваться администратором', async () => {
		const res = await register({ role: 'ADMIN' });

		expect(res.status).toBe(400);
		expect(res.body.errors.map((e) => e.field)).toContain('role');
		expect(await prisma.user.count()).toBe(0);
	});

	it('игнорирует служебные поля из запроса (isActive, id, passwordHash)', async () => {
		const res = await register({ isActive: false, id: 'custom-id', passwordHash: 'hacked' });
		const user = await prisma.user.findUnique({ where: { email: 'ivan@example.com' } });

		expect(res.status).toBe(201);
		expect(user.isActive).toBe(true);
		expect(user.id).not.toBe('custom-id');
		expect(user.passwordHash).not.toBe('hacked');
	});

	it('возвращает 400 на некорректный JSON', async () => {
		const res = await request(app)
			.post(`${API}/register`)
			.set('Content-Type', 'application/json')
			.send('{"email": ');

		expect(res.status).toBe(400);
	});
});

describe('POST /login', () => {
	beforeEach(async () => {
		await register();
	});

	it('пускает с верными данными', async () => {
		const res = await login('ivan@example.com');

		expect(res.status).toBe(200);
		expect(res.body.data.user).toMatchObject({ email: 'ivan@example.com', role: 'FREELANCER' });
		expect(res.body.data.tokens.accessToken).toEqual(expect.any(String));
	});

	it('принимает email в другом регистре', async () => {
		const res = await login('IVAN@EXAMPLE.COM');

		expect(res.status).toBe(200);
	});

	it('одинаково отвечает на неверный пароль и несуществующий email', async () => {
		const wrongPassword = await login('ivan@example.com', 'WrongPass1');
		const unknownEmail = await login('nobody@example.com');

		expect(wrongPassword.status).toBe(401);
		expect(unknownEmail.status).toBe(401);
		// по тексту нельзя понять, существует ли такой email
		expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
	});

	it('не пускает заблокированного пользователя', async () => {
		await prisma.user.update({ where: { email: 'ivan@example.com' }, data: { isActive: false } });

		const res = await login('ivan@example.com');

		expect(res.status).toBe(401);
	});

	it('два входа подряд выдают разные refresh-токены', async () => {
		const first = await login('ivan@example.com');
		const second = await login('ivan@example.com');

		expect(first.body.data.tokens.refreshToken).not.toBe(second.body.data.tokens.refreshToken);
		// 1 токен после регистрации и 2 после входов
		expect(await prisma.refreshToken.count()).toBe(3);
	});

	it('требует email и пароль', async () => {
		const res = await request(app).post(`${API}/login`).send({});

		expect(res.status).toBe(400);
	});
});

describe('POST /refresh', () => {
	let tokens;

	beforeEach(async () => {
		const res = await register();
		tokens = res.body.data.tokens;
	});

	it('выдаёт новую пару токенов', async () => {
		const res = await refresh(tokens.refreshToken);

		expect(res.status).toBe(200);
		expect(res.body.data.accessToken).toEqual(expect.any(String));
		expect(res.body.data.refreshToken).not.toBe(tokens.refreshToken);
	});

	it('refresh-токен одноразовый: повторное использование отклоняется', async () => {
		await refresh(tokens.refreshToken);
		const second = await refresh(tokens.refreshToken);

		expect(second.status).toBe(401);
	});

	it('отклоняет произвольную строку', async () => {
		const res = await refresh('это-не-токен');

		expect(res.status).toBe(401);
	});

	it('отклоняет access-токен вместо refresh', async () => {
		const res = await refresh(tokens.accessToken);

		expect(res.status).toBe(401);
	});

	it('отклоняет токен, срок которого истёк в базе', async () => {
		await prisma.refreshToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

		const res = await refresh(tokens.refreshToken);

		expect(res.status).toBe(401);
	});

	it('требует refreshToken в теле запроса', async () => {
		const res = await request(app).post(`${API}/refresh`).send({});

		expect(res.status).toBe(400);
	});
});

describe('POST /logout', () => {
	it('удаляет refresh-токен: обновить сессию после выхода нельзя', async () => {
		const registered = await register();
		const { refreshToken } = registered.body.data.tokens;

		const out = await request(app).post(`${API}/logout`).send({ refreshToken });
		const after = await refresh(refreshToken);

		expect(out.status).toBe(200);
		expect(await prisma.refreshToken.count()).toBe(0);
		expect(after.status).toBe(401);
	});

	it('не падает, если тело запроса не передано', async () => {
		const res = await request(app).post(`${API}/logout`);

		expect(res.status).toBe(200);
	});
});
