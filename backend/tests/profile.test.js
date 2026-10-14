import { beforeEach, describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app.js';
import { prisma, resetDb } from './helpers/db.js';
import { authHeader, register } from './helpers/auth.js';

const PROFILE = '/api/v1/profile/me';

const getProfile = (token) => request(app).get(PROFILE).set(authHeader(token));
const updateProfile = (token, body) => request(app).put(PROFILE).set(authHeader(token)).send(body);

// Регистрирует пользователя и возвращает его id и токены
const createUser = async (overrides) => {
	const res = await register(overrides);
	return {
		id: res.body.data.user.id,
		email: res.body.data.user.email,
		accessToken: res.body.data.tokens.accessToken,
		refreshToken: res.body.data.tokens.refreshToken,
	};
};

const profileOf = (userId) => prisma.profile.findUnique({ where: { userId } });

beforeEach(resetDb);

describe('Доступ к профилю без действительной авторизации', () => {
	let user;

	beforeEach(async () => {
		user = await createUser();
	});

	it('GET без токена: 401', async () => {
		const res = await request(app).get(PROFILE);

		expect(res.status).toBe(401);
	});

	it('PUT без токена: 401', async () => {
		const res = await request(app).put(PROFILE).send({ region: 'Москва' });

		expect(res.status).toBe(401);
	});

	it('заголовок не в формате Bearer: 401', async () => {
		const res = await request(app).get(PROFILE).set('Authorization', `Token ${user.accessToken}`);

		expect(res.status).toBe(401);
	});

	it('произвольная строка вместо токена: 401', async () => {
		// const res = await getProfile('это-не-токен');
		const res = await getProfile('not-a-real-token');

		expect(res.status).toBe(401);
	});

	it('токен, подписанный чужим секретом: 401', async () => {
		const forged = jwt.sign({ userId: user.id, role: 'FREELANCER' }, 'чужой-секрет');

		const res = await getProfile(forged);

		expect(res.status).toBe(401);
	});

	it('просроченный токен: 401', async () => {
		const expired = jwt.sign(
			{ userId: user.id, role: 'FREELANCER', exp: Math.floor(Date.now() / 1000) - 60 },
			process.env.JWT_ACCESS_SECRET,
		);

		const res = await getProfile(expired);

		expect(res.status).toBe(401);
	});

	it('refresh-токен нельзя использовать как access: 401', async () => {
		const res = await getProfile(user.refreshToken);

		expect(res.status).toBe(401);
	});

	it('заблокированный пользователь с действующим токеном: 401', async () => {
		await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });

		const res = await getProfile(user.accessToken);

		expect(res.status).toBe(401);
	});

	it('удалённый пользователь с действующим токеном: 401', async () => {
		await prisma.user.delete({ where: { id: user.id } });

		const res = await getProfile(user.accessToken);

		expect(res.status).toBe(401);
	});
});

describe('GET /profile/me', () => {
	it('возвращает данные текущего пользователя без хеша пароля', async () => {
		const user = await createUser();

		const res = await getProfile(user.accessToken);

		expect(res.status).toBe(200);
		expect(res.body.data.user).toEqual({
			id: user.id,
			email: 'ivan@example.com',
			role: 'FREELANCER',
		});
		expect(res.body.data.profile.fullName).toBe('Иван Петров');
		expect(JSON.stringify(res.body)).not.toContain('passwordHash');
	});

	it('каждый видит только свой профиль', async () => {
		const first = await createUser();
		const second = await createUser({ email: 'anna@example.com', fullName: 'Анна Смирнова' });

		const firstRes = await getProfile(first.accessToken);
		const secondRes = await getProfile(second.accessToken);

		expect(firstRes.body.data.profile.fullName).toBe('Иван Петров');
		expect(secondRes.body.data.profile.fullName).toBe('Анна Смирнова');
	});
});

describe('PUT /profile/me: права и целостность данных', () => {
	it('сохраняет общие поля и список навыков', async () => {
		const user = await createUser();

		const res = await updateProfile(user.accessToken, {
			region: 'Москва',
			phone: '+7 (999) 123-45-67',
			site: 'https://example.com',
			skills: ['React', 'Node.js'],
		});

		expect(res.status).toBe(200);
		const profile = await profileOf(user.id);
		expect(profile.region).toBe('Москва');
		expect(profile.phone).toBe('+7 (999) 123-45-67');
		expect(profile.skills).toEqual(['React', 'Node.js']);
	});

	it('меняет только свой профиль, даже если в теле указан чужой userId', async () => {
		const attacker = await createUser();
		const victim = await createUser({ email: 'victim@example.com', fullName: 'Жертва' });

		const res = await updateProfile(attacker.accessToken, {
			fullName: 'Взломщик',
			userId: victim.id,
			id: (await profileOf(victim.id)).id,
		});

		expect(res.status).toBe(200);
		expect((await profileOf(attacker.id)).fullName).toBe('Взломщик');
		expect((await profileOf(victim.id)).fullName).toBe('Жертва');
	});

	it('не позволяет повысить себе роль через профиль', async () => {
		const user = await createUser();

		await updateProfile(user.accessToken, { role: 'ADMIN' });

		const saved = await prisma.user.findUnique({ where: { id: user.id } });
		expect(saved.role).toBe('FREELANCER');
	});

	it('не позволяет сменить email через профиль', async () => {
		const user = await createUser();

		await updateProfile(user.accessToken, { email: 'hacker@example.com' });

		const saved = await prisma.user.findUnique({ where: { id: user.id } });
		expect(saved.email).toBe('ivan@example.com');
	});

	it('исполнитель сохраняет свои поля и не может записать поля заказчика', async () => {
		const user = await createUser({ role: 'FREELANCER' });

		await updateProfile(user.accessToken, {
			experience: '3 года',
			rate: 1500,
			companyName: 'ООО Тест',
			marketYears: 5,
		});

		const profile = await profileOf(user.id);
		expect(profile.experience).toBe('3 года');
		expect(profile.rate).toBe(1500);
		expect(profile.companyName).toBeNull();
		expect(profile.marketYears).toBeNull();
	});

	it('заказчик сохраняет свои поля и не может записать поля исполнителя', async () => {
		const user = await createUser({ email: 'boss@example.com', role: 'CUSTOMER' });

		await updateProfile(user.accessToken, {
			experience: '5 лет',
			rate: 2000,
			companyName: 'ООО Ромашка',
			marketYears: 7,
		});

		const profile = await profileOf(user.id);
		expect(profile.companyName).toBe('ООО Ромашка');
		expect(profile.marketYears).toBe(7);
		expect(profile.experience).toBeNull();
		expect(profile.rate).toBeNull();
	});

	it('частичное обновление не затирает остальные поля', async () => {
		const user = await createUser();
		await updateProfile(user.accessToken, { region: 'Москва' });

		await updateProfile(user.accessToken, { sphere: 'Frontend Developer' });

		const profile = await profileOf(user.id);
		expect(profile.region).toBe('Москва');
		expect(profile.sphere).toBe('Frontend Developer');
	});

	it.each([
		['пустая строка', ''],
		['только пробелы', '   '],
	])('очищает поле: %s превращается в null', async (_, value) => {
		const user = await createUser();
		await updateProfile(user.accessToken, { region: 'Москва' });

		await updateProfile(user.accessToken, { region: value });

		expect((await profileOf(user.id)).region).toBeNull();
	});

	it('пустое тело запроса ничего не меняет', async () => {
		const user = await createUser();

		const res = await updateProfile(user.accessToken, {});

		expect(res.status).toBe(200);
		expect((await profileOf(user.id)).fullName).toBe('Иван Петров');
	});
});

describe('PUT /profile/me: валидация', () => {
	it.each([
		['site', { site: 'javascript:alert(1)' }],
		['site', { site: 'ftp://example.com/file' }],
		['site', { site: 'не ссылка' }],
		['about', { about: 'я'.repeat(501) }],
		['phone', { phone: 'abc' }],
		['rate', { rate: -1 }],
		['rate', { rate: 1.5 }],
		['rate', { rate: '1500' }],
		['skills', { skills: Array.from({ length: 31 }, (_, i) => `навык${i}`) }],
		['fullName', { fullName: 'А' }],
	])('отклоняет некорректное поле %s (случай №%#)', async (field, body) => {
		const user = await createUser();

		const res = await updateProfile(user.accessToken, body);

		expect(res.status).toBe(400);
		expect(res.body.errors.map((e) => e.field)).toContain(field);
	});

	it('при ошибке валидации ничего не сохраняет', async () => {
		const user = await createUser();

		await updateProfile(user.accessToken, { region: 'Москва', site: 'javascript:alert(1)' });

		expect((await profileOf(user.id)).region).toBeNull();
	});
});
