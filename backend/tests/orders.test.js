import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma, resetDb } from './helpers/db.js';
import { authHeader, createUser } from './helpers/auth.js';

const ORDERS = '/api/v1/orders';

const validOrder = (overrides = {}) => ({
	title: 'Разработка лендинга для магазина',
	description: 'Нужен адаптивный лендинг с формой заявки и интеграцией с CRM.',
	budget: 40000,
	tools: ['React', 'Node.js'],
	...overrides,
});

const createCustomer = (email = 'customer@example.com') =>
	createUser({ email, role: 'CUSTOMER', fullName: 'Анна Заказчикова' });
const createFreelancer = (email = 'freelancer@example.com') =>
	createUser({ email, role: 'FREELANCER' });

const postOrder = (token, body) => request(app).post(ORDERS).set(authHeader(token)).send(body);
const listOrders = (token, query = {}) =>
	request(app).get(ORDERS).set(authHeader(token)).query(query);
const getOrder = (token, id) => request(app).get(`${ORDERS}/${id}`).set(authHeader(token));
const patchOrder = (token, id, body) =>
	request(app).patch(`${ORDERS}/${id}`).set(authHeader(token)).send(body);
const cancelOrder = (token, id) =>
	request(app).post(`${ORDERS}/${id}/cancel`).set(authHeader(token));

const putFavorite = (token, id) =>
	request(app).put(`${ORDERS}/${id}/favorite`).set(authHeader(token));
const deleteFavorite = (token, id) =>
	request(app).delete(`${ORDERS}/${id}/favorite`).set(authHeader(token));
const listFavorites = (token, query = {}) =>
	request(app).get(`${ORDERS}/favorites`).set(authHeader(token)).query(query);

// Рейтинг заказчика в базе (в продакшене он будет считаться из отзывов)
const setRating = (userId, ratingAvg, ratingCount = 5) =>
	prisma.profile.update({ where: { userId }, data: { ratingAvg, ratingCount } });

// Создаёт заказ напрямую в базе, минуя API
const insertOrder = (customerId, overrides = {}) =>
	prisma.order.create({ data: { customerId, ...validOrder(), ...overrides } });

// Имена полей из ошибок валидации без номеров элементов (tools.0 -> tools)
const errorFields = (res) => res.body.errors.map((error) => error.field.split('.')[0]);

beforeEach(resetDb);

describe('POST /orders: создание', () => {
	it('заказчик создаёт заказ: он открыт и привязан к автору', async () => {
		const customer = await createCustomer();

		const res = await postOrder(customer.accessToken, validOrder());

		expect(res.status).toBe(201);
		expect(res.body.data.order).toMatchObject({
			title: 'Разработка лендинга для магазина',
			budget: 40000,
			tools: ['React', 'Node.js'],
			status: 'OPEN',
			customer: { id: customer.id, name: 'Анна Заказчикова' },
		});
		const saved = await prisma.order.findUnique({ where: { id: res.body.data.order.id } });
		expect(saved.customerId).toBe(customer.id);
	});

	it('список инструментов по умолчанию пустой', async () => {
		const customer = await createCustomer();
		const body = validOrder();
		delete body.tools;

		const res = await postOrder(customer.accessToken, body);

		expect(res.status).toBe(201);
		expect(res.body.data.order.tools).toEqual([]);
	});

	it('исполнитель не может создавать заказы: 403', async () => {
		const freelancer = await createFreelancer();

		const res = await postOrder(freelancer.accessToken, validOrder());

		expect(res.status).toBe(403);
		expect(await prisma.order.count()).toBe(0);
	});

	it('без токена: 401', async () => {
		const res = await request(app).post(ORDERS).send(validOrder());

		expect(res.status).toBe(401);
	});

	it('заблокированный заказчик с действующим токеном: 401', async () => {
		const customer = await createCustomer();
		await prisma.user.update({ where: { id: customer.id }, data: { isActive: false } });

		const res = await postOrder(customer.accessToken, validOrder());

		expect(res.status).toBe(401);
		expect(await prisma.order.count()).toBe(0);
	});

	it('игнорирует customerId и status из запроса', async () => {
		const customer = await createCustomer();
		const other = await createCustomer('other@example.com');

		const res = await postOrder(
			customer.accessToken,
			validOrder({ customerId: other.id, status: 'COMPLETED' }),
		);

		expect(res.status).toBe(201);
		expect(res.body.data.order.status).toBe('OPEN');
		const saved = await prisma.order.findUnique({ where: { id: res.body.data.order.id } });
		expect(saved.customerId).toBe(customer.id);
	});

	it('не раскрывает e-mail заказчика в ответе', async () => {
		const customer = await createCustomer();

		const res = await postOrder(customer.accessToken, validOrder());

		expect(JSON.stringify(res.body)).not.toContain('customer@example.com');
	});

	it.each([
		['title', { title: undefined }],
		['title', { title: 'abc' }],
		['title', { title: 'я'.repeat(151) }],
		['description', { description: 'коротко' }],
		['description', { description: 'я'.repeat(5001) }],
		['budget', { budget: 50 }],
		['budget', { budget: 100000001 }],
		['budget', { budget: 1000.5 }],
		['budget', { budget: '40000' }],
		['tools', { tools: Array.from({ length: 21 }, (_, i) => `tool${i}`) }],
		['tools', { tools: [''] }],
	])('отклоняет некорректное поле %s (случай №%#)', async (field, overrides) => {
		const customer = await createCustomer();

		const res = await postOrder(customer.accessToken, validOrder(overrides));

		expect(res.status).toBe(400);
		expect(errorFields(res)).toContain(field);
		expect(await prisma.order.count()).toBe(0);
	});
});

describe('GET /orders: список', () => {
	it('исполнитель видит только открытые заказы', async () => {
		const customer = await createCustomer();
		const freelancer = await createFreelancer();
		await insertOrder(customer.id, { title: 'Открытый заказ' });
		await insertOrder(customer.id, { title: 'Отменённый заказ', status: 'CANCELLED' });
		await insertOrder(customer.id, { title: 'Заказ в работе', status: 'IN_PROGRESS' });

		const res = await listOrders(freelancer.accessToken);

		expect(res.status).toBe(200);
		expect(res.body.data.items.map((order) => order.title)).toEqual(['Открытый заказ']);
		expect(res.body.data.total).toBe(1);
	});

	it('без токена: 401', async () => {
		const res = await request(app).get(ORDERS);

		expect(res.status).toBe(401);
	});

	it('сортирует от новых к старым', async () => {
		const customer = await createCustomer();
		await insertOrder(customer.id, { title: 'Январь', createdAt: new Date('2026-01-01') });
		await insertOrder(customer.id, { title: 'Март', createdAt: new Date('2026-03-01') });
		await insertOrder(customer.id, { title: 'Февраль', createdAt: new Date('2026-02-01') });

		const res = await listOrders(customer.accessToken);

		expect(res.body.data.items.map((order) => order.title)).toEqual(['Март', 'Февраль', 'Январь']);
	});

	it('разбивает на страницы', async () => {
		const customer = await createCustomer();
		await prisma.order.createMany({
			data: Array.from({ length: 25 }, (_, i) => ({
				customerId: customer.id,
				...validOrder({ title: `Заказ номер ${i + 1}` }),
			})),
		});

		const third = await listOrders(customer.accessToken, { page: 3, limit: 10 });
		const byDefault = await listOrders(customer.accessToken);

		expect(third.body.data).toMatchObject({ total: 25, page: 3, limit: 10, pages: 3 });
		expect(third.body.data.items).toHaveLength(5);
		expect(byDefault.body.data.items).toHaveLength(10);
	});

	it.each([
		['limit', { limit: 51 }],
		['limit', { limit: 0 }],
		['page', { page: 0 }],
		['page', { page: 'abc' }],
		['budgetMin', { budgetMin: -1 }],
	])('отклоняет некорректный параметр %s (случай №%#)', async (field, query) => {
		const customer = await createCustomer();

		const res = await listOrders(customer.accessToken, query);

		expect(res.status).toBe(400);
		expect(errorFields(res)).toContain(field);
	});

	it('отклоняет budgetMin больше budgetMax', async () => {
		const customer = await createCustomer();

		const res = await listOrders(customer.accessToken, { budgetMin: 5000, budgetMax: 1000 });

		expect(res.status).toBe(400);
	});

	it('фильтрует по бюджету', async () => {
		const customer = await createCustomer();
		await insertOrder(customer.id, { title: 'Дешёвый', budget: 10000 });
		await insertOrder(customer.id, { title: 'Средний', budget: 50000 });
		await insertOrder(customer.id, { title: 'Дорогой', budget: 200000 });

		const res = await listOrders(customer.accessToken, { budgetMin: 40000, budgetMax: 100000 });

		expect(res.body.data.items.map((order) => order.title)).toEqual(['Средний']);
	});

	it('фильтрует по инструментам: подходит любой из перечисленных', async () => {
		const customer = await createCustomer();
		await insertOrder(customer.id, { title: 'Первый', tools: ['React'] });
		await insertOrder(customer.id, { title: 'Второй', tools: ['Vue.js', 'Node.js'] });
		await insertOrder(customer.id, { title: 'Третий', tools: ['PHP'] });

		const res = await listOrders(customer.accessToken, { tools: 'React,Vue.js' });

		expect(res.body.data.items.map((order) => order.title).sort()).toEqual(['Второй', 'Первый']);
	});

	it('ищет по названию без учёта регистра', async () => {
		const customer = await createCustomer();
		await insertOrder(customer.id, { title: 'Landing page for a shop' });
		await insertOrder(customer.id, { title: 'Интернет-магазин на Vue' });

		const res = await listOrders(customer.accessToken, { search: 'LANDING' });

		expect(res.body.data.items.map((order) => order.title)).toEqual(['Landing page for a shop']);
	});

	it('символ % в поиске не работает как маска', async () => {
		const customer = await createCustomer();
		await insertOrder(customer.id, { title: 'Разработка лендинга' });

		const res = await listOrders(customer.accessToken, { search: '%' });

		expect(res.body.data.items).toHaveLength(0);
	});

	it('символ % ищется как обычный символ', async () => {
		const customer = await createCustomer();
		await insertOrder(customer.id, { title: 'Скидка 50% на разработку' });
		await insertOrder(customer.id, { title: 'Разработка лендинга' });

		const res = await listOrders(customer.accessToken, { search: '50%' });

		expect(res.body.data.items.map((order) => order.title)).toEqual(['Скидка 50% на разработку']);
	});

	it('не отдаёт в списке описание и e-mail заказчика', async () => {
		const customer = await createCustomer();
		await insertOrder(customer.id);

		const res = await listOrders(customer.accessToken);

		expect(res.body.data.items[0].description).toBeUndefined();
		expect(JSON.stringify(res.body)).not.toContain('customer@example.com');
	});
});

describe('GET /orders/:id: просмотр', () => {
	it('любой вошедший видит открытый заказ с описанием', async () => {
		const customer = await createCustomer();
		const freelancer = await createFreelancer();
		const order = await insertOrder(customer.id);

		const res = await getOrder(freelancer.accessToken, order.id);

		expect(res.status).toBe(200);
		expect(res.body.data.order.description).toBe(order.description);
		expect(res.body.data.order.customer.name).toBe('Анна Заказчикова');
	});

	it('несуществующий заказ: 404', async () => {
		const customer = await createCustomer();

		const res = await getOrder(customer.accessToken, 'no-such-id');

		expect(res.status).toBe(404);
	});

	it('отменённый заказ виден только автору', async () => {
		const author = await createCustomer();
		const other = await createCustomer('other@example.com');
		const order = await insertOrder(author.id, { status: 'CANCELLED' });

		const forAuthor = await getOrder(author.accessToken, order.id);
		const forOther = await getOrder(other.accessToken, order.id);

		expect(forAuthor.status).toBe(200);
		expect(forOther.status).toBe(404);
	});

	it('без токена: 401', async () => {
		const customer = await createCustomer();
		const order = await insertOrder(customer.id);

		const res = await request(app).get(`${ORDERS}/${order.id}`);

		expect(res.status).toBe(401);
	});
});

describe('PATCH /orders/:id: изменение', () => {
	it('автор меняет поля, остальные не затрагиваются', async () => {
		const customer = await createCustomer();
		const order = await insertOrder(customer.id);

		const res = await patchOrder(customer.accessToken, order.id, {
			title: 'Новое название заказа',
			budget: 60000,
		});

		expect(res.status).toBe(200);
		const saved = await prisma.order.findUnique({ where: { id: order.id } });
		expect(saved.title).toBe('Новое название заказа');
		expect(saved.budget).toBe(60000);
		expect(saved.description).toBe(order.description);
		expect(saved.tools).toEqual(['React', 'Node.js']);
	});

	it('список инструментов можно очистить', async () => {
		const customer = await createCustomer();
		const order = await insertOrder(customer.id);

		await patchOrder(customer.accessToken, order.id, { tools: [] });

		expect((await prisma.order.findUnique({ where: { id: order.id } })).tools).toEqual([]);
	});

	it('чужой заказ изменить нельзя: 403', async () => {
		const author = await createCustomer();
		const other = await createCustomer('other@example.com');
		const order = await insertOrder(author.id);

		const res = await patchOrder(other.accessToken, order.id, { title: 'Взломанное название' });

		expect(res.status).toBe(403);
		expect((await prisma.order.findUnique({ where: { id: order.id } })).title).toBe(order.title);
	});

	it('исполнитель изменить заказ не может: 403', async () => {
		const customer = await createCustomer();
		const freelancer = await createFreelancer();
		const order = await insertOrder(customer.id);

		const res = await patchOrder(freelancer.accessToken, order.id, {
			title: 'Взломанное название',
		});

		expect(res.status).toBe(403);
	});

	it('не позволяет менять статус и автора через тело запроса', async () => {
		const customer = await createCustomer();
		const other = await createCustomer('other@example.com');
		const order = await insertOrder(customer.id);

		await patchOrder(customer.accessToken, order.id, {
			title: 'Новое название заказа',
			status: 'COMPLETED',
			customerId: other.id,
		});

		const saved = await prisma.order.findUnique({ where: { id: order.id } });
		expect(saved.status).toBe('OPEN');
		expect(saved.customerId).toBe(customer.id);
	});

	it('заказ не в статусе OPEN изменить нельзя: 409', async () => {
		const customer = await createCustomer();
		const order = await insertOrder(customer.id, { status: 'IN_PROGRESS' });

		const res = await patchOrder(customer.accessToken, order.id, {
			title: 'Новое название заказа',
		});

		expect(res.status).toBe(409);
	});

	it('пустое тело запроса: 400', async () => {
		const customer = await createCustomer();
		const order = await insertOrder(customer.id);

		const res = await patchOrder(customer.accessToken, order.id, {});

		expect(res.status).toBe(400);
	});

	it('некорректный бюджет: 400', async () => {
		const customer = await createCustomer();
		const order = await insertOrder(customer.id);

		const res = await patchOrder(customer.accessToken, order.id, { budget: -5 });

		expect(res.status).toBe(400);
		expect(errorFields(res)).toContain('budget');
	});

	it('несуществующий заказ: 404', async () => {
		const customer = await createCustomer();

		const res = await patchOrder(customer.accessToken, 'no-such-id', { budget: 5000 });

		expect(res.status).toBe(404);
	});
});

describe('POST /orders/:id/cancel: отмена', () => {
	it('автор отменяет открытый заказ, он пропадает из списка', async () => {
		const customer = await createCustomer();
		const order = await insertOrder(customer.id);

		const res = await cancelOrder(customer.accessToken, order.id);
		const list = await listOrders(customer.accessToken);

		expect(res.status).toBe(200);
		expect(res.body.data.order.status).toBe('CANCELLED');
		expect(list.body.data.items).toHaveLength(0);
	});

	it('чужой заказ отменить нельзя: 403', async () => {
		const author = await createCustomer();
		const other = await createCustomer('other@example.com');
		const order = await insertOrder(author.id);

		const res = await cancelOrder(other.accessToken, order.id);

		expect(res.status).toBe(403);
		expect((await prisma.order.findUnique({ where: { id: order.id } })).status).toBe('OPEN');
	});

	it('исполнитель отменить заказ не может: 403', async () => {
		const customer = await createCustomer();
		const freelancer = await createFreelancer();
		const order = await insertOrder(customer.id);

		const res = await cancelOrder(freelancer.accessToken, order.id);

		expect(res.status).toBe(403);
	});

	it('повторная отмена: 409', async () => {
		const customer = await createCustomer();
		const order = await insertOrder(customer.id);
		await cancelOrder(customer.accessToken, order.id);

		const res = await cancelOrder(customer.accessToken, order.id);

		expect(res.status).toBe(409);
	});

	it('заказ в работе отменить нельзя: 409', async () => {
		const customer = await createCustomer();
		const order = await insertOrder(customer.id, { status: 'IN_PROGRESS' });

		const res = await cancelOrder(customer.accessToken, order.id);

		expect(res.status).toBe(409);
	});
});
describe('PUT/DELETE /orders/:id/favorite: избранное', () => {
	it('исполнитель добавляет заказ в избранное', async () => {
		const customer = await createCustomer();
		const freelancer = await createFreelancer();
		const order = await insertOrder(customer.id);

		const res = await putFavorite(freelancer.accessToken, order.id);

		expect(res.status).toBe(200);
		expect(await prisma.favoriteOrder.count({ where: { userId: freelancer.id } })).toBe(1);
	});

	it('повторное добавление не создаёт дубликат', async () => {
		const customer = await createCustomer();
		const freelancer = await createFreelancer();
		const order = await insertOrder(customer.id);

		const first = await putFavorite(freelancer.accessToken, order.id);
		const second = await putFavorite(freelancer.accessToken, order.id);

		expect(first.status).toBe(200);
		expect(second.status).toBe(200);
		expect(await prisma.favoriteOrder.count()).toBe(1);
	});

	it('заказчик не может добавлять в избранное: 403', async () => {
		const customer = await createCustomer();
		const order = await insertOrder(customer.id);

		const res = await putFavorite(customer.accessToken, order.id);

		expect(res.status).toBe(403);
		expect(await prisma.favoriteOrder.count()).toBe(0);
	});

	it('без токена: 401', async () => {
		const customer = await createCustomer();
		const order = await insertOrder(customer.id);

		const res = await request(app).put(`${ORDERS}/${order.id}/favorite`);

		expect(res.status).toBe(401);
	});

	it('несуществующий заказ: 404', async () => {
		const freelancer = await createFreelancer();

		const res = await putFavorite(freelancer.accessToken, 'no-such-id');

		expect(res.status).toBe(404);
	});

	it('отменённый заказ нельзя добавить: 404, наличие заказа не раскрывается', async () => {
		const customer = await createCustomer();
		const freelancer = await createFreelancer();
		const order = await insertOrder(customer.id, { status: 'CANCELLED' });

		const res = await putFavorite(freelancer.accessToken, order.id);

		expect(res.status).toBe(404);
		expect(await prisma.favoriteOrder.count()).toBe(0);
	});

	it('исполнитель убирает заказ из избранного', async () => {
		const customer = await createCustomer();
		const freelancer = await createFreelancer();
		const order = await insertOrder(customer.id);
		await putFavorite(freelancer.accessToken, order.id);

		const res = await deleteFavorite(freelancer.accessToken, order.id);

		expect(res.status).toBe(200);
		expect(await prisma.favoriteOrder.count()).toBe(0);
	});

	it('удаление заказа, которого нет в избранном: 200', async () => {
		const customer = await createCustomer();
		const freelancer = await createFreelancer();
		const order = await insertOrder(customer.id);

		const res = await deleteFavorite(freelancer.accessToken, order.id);

		expect(res.status).toBe(200);
	});

	it('заказчик не может удалять из избранного: 403', async () => {
		const customer = await createCustomer();
		const order = await insertOrder(customer.id);

		const res = await deleteFavorite(customer.accessToken, order.id);

		expect(res.status).toBe(403);
	});
});

describe('isFavorite: избранное личное', () => {
	it('в списке сердечко видит только тот, кто его поставил', async () => {
		const customer = await createCustomer();
		const freelancerA = await createFreelancer('a@example.com');
		const freelancerB = await createFreelancer('b@example.com');
		const order = await insertOrder(customer.id);
		await putFavorite(freelancerA.accessToken, order.id);

		const forA = await listOrders(freelancerA.accessToken);
		const forB = await listOrders(freelancerB.accessToken);

		expect(forA.body.data.items[0].isFavorite).toBe(true);
		expect(forB.body.data.items[0].isFavorite).toBe(false);
	});

	it('в карточке заказа тоже только своё сердечко', async () => {
		const customer = await createCustomer();
		const freelancerA = await createFreelancer('a@example.com');
		const freelancerB = await createFreelancer('b@example.com');
		const order = await insertOrder(customer.id);
		await putFavorite(freelancerA.accessToken, order.id);

		const forA = await getOrder(freelancerA.accessToken, order.id);
		const forB = await getOrder(freelancerB.accessToken, order.id);

		expect(forA.body.data.order.isFavorite).toBe(true);
		expect(forB.body.data.order.isFavorite).toBe(false);
	});

	it('удаление у одного исполнителя не затрагивает другого', async () => {
		const customer = await createCustomer();
		const freelancerA = await createFreelancer('a@example.com');
		const freelancerB = await createFreelancer('b@example.com');
		const order = await insertOrder(customer.id);
		await putFavorite(freelancerA.accessToken, order.id);
		await putFavorite(freelancerB.accessToken, order.id);

		await deleteFavorite(freelancerA.accessToken, order.id);

		const forB = await listOrders(freelancerB.accessToken);
		expect(forB.body.data.items[0].isFavorite).toBe(true);
		expect(await prisma.favoriteOrder.count()).toBe(1);
	});

	it('у только что созданного заказа isFavorite: false', async () => {
		const customer = await createCustomer();

		const res = await postOrder(customer.accessToken, validOrder());

		expect(res.body.data.order.isFavorite).toBe(false);
	});
});

describe('GET /orders/favorites: вкладка «Избранное»', () => {
	it('возвращает только мои заказы, последние добавленные сверху', async () => {
		const customer = await createCustomer();
		const freelancerA = await createFreelancer('a@example.com');
		const freelancerB = await createFreelancer('b@example.com');
		const first = await insertOrder(customer.id, { title: 'Добавлен первым' });
		const second = await insertOrder(customer.id, { title: 'Добавлен вторым' });
		const foreign = await insertOrder(customer.id, { title: 'Чужое сердечко' });
		await prisma.favoriteOrder.createMany({
			data: [
				{ userId: freelancerA.id, orderId: first.id, createdAt: new Date('2026-01-01') },
				{ userId: freelancerA.id, orderId: second.id, createdAt: new Date('2026-02-01') },
				{ userId: freelancerB.id, orderId: foreign.id },
			],
		});

		const res = await listFavorites(freelancerA.accessToken);

		expect(res.status).toBe(200);
		expect(res.body.data.items.map((order) => order.title)).toEqual([
			'Добавлен вторым',
			'Добавлен первым',
		]);
		expect(res.body.data.items.every((order) => order.isFavorite)).toBe(true);
		expect(res.body.data.total).toBe(2);
	});

	it('/favorites не принимается за id заказа', async () => {
		const freelancer = await createFreelancer();

		const res = await listFavorites(freelancer.accessToken);

		expect(res.status).toBe(200);
		expect(res.body.data.items).toEqual([]);
	});

	it('заказчик: 403', async () => {
		const customer = await createCustomer();

		const res = await listFavorites(customer.accessToken);

		expect(res.status).toBe(403);
	});

	it('без токена: 401', async () => {
		const res = await request(app).get(`${ORDERS}/favorites`);

		expect(res.status).toBe(401);
	});

	it('отменённый заказ пропадает из избранного', async () => {
		const customer = await createCustomer();
		const freelancer = await createFreelancer();
		const order = await insertOrder(customer.id);
		await putFavorite(freelancer.accessToken, order.id);

		await cancelOrder(customer.accessToken, order.id);
		const res = await listFavorites(freelancer.accessToken);

		expect(res.body.data.items).toHaveLength(0);
		expect(res.body.data.total).toBe(0);
	});

	it('разбивает на страницы', async () => {
		const customer = await createCustomer();
		const freelancer = await createFreelancer();
		for (let i = 1; i <= 12; i++) {
			const order = await insertOrder(customer.id, { title: `Заказ номер ${i}` });
			await prisma.favoriteOrder.create({
				data: { userId: freelancer.id, orderId: order.id, createdAt: new Date(2026, 0, i) },
			});
		}

		const res = await listFavorites(freelancer.accessToken, { page: 3, limit: 5 });

		expect(res.body.data).toMatchObject({ total: 12, page: 3, limit: 5, pages: 3 });
		expect(res.body.data.items).toHaveLength(2);
	});

	it('некорректная страница: 400', async () => {
		const freelancer = await createFreelancer();

		const res = await listFavorites(freelancer.accessToken, { page: 0 });

		expect(res.status).toBe(400);
	});
});

describe('Рейтинг заказчика в списке', () => {
	it('пока нет отзывов, rating равен null', async () => {
		const customer = await createCustomer();
		await insertOrder(customer.id);

		const res = await listOrders(customer.accessToken);

		expect(res.body.data.items[0].customer).toMatchObject({ rating: null, reviewsCount: 0 });
	});

	it('отдаёт рейтинг и число отзывов', async () => {
		const customer = await createCustomer();
		await setRating(customer.id, 4.9, 10);
		await insertOrder(customer.id);

		const res = await listOrders(customer.accessToken);

		expect(res.body.data.items[0].customer).toMatchObject({ rating: 4.9, reviewsCount: 10 });
	});

	it('minRating оставляет только заказчиков с рейтингом не ниже порога', async () => {
		const high = await createCustomer('high@example.com');
		const low = await createCustomer('low@example.com');
		await setRating(high.id, 4.9);
		await setRating(low.id, 4.2);
		await insertOrder(high.id, { title: 'Высокий рейтинг' });
		await insertOrder(low.id, { title: 'Низкий рейтинг' });

		const res = await listOrders(high.accessToken, { minRating: 4.8 });

		expect(res.body.data.items.map((order) => order.title)).toEqual(['Высокий рейтинг']);
	});

	it('заказчик без отзывов не попадает под minRating', async () => {
		const customer = await createCustomer();
		await insertOrder(customer.id);

		const res = await listOrders(customer.accessToken, { minRating: 4.8 });

		expect(res.body.data.items).toHaveLength(0);
	});

	it('minRating вне диапазона: 400', async () => {
		const customer = await createCustomer();

		const res = await listOrders(customer.accessToken, { minRating: 6 });

		expect(res.status).toBe(400);
		expect(errorFields(res)).toContain('minRating');
	});
});
describe('POST /orders: дедлайн', () => {
	it('сохраняет дедлайн и отдаёт его датой ГГГГ-ММ-ДД', async () => {
		const customer = await createCustomer();

		const res = await postOrder(customer.accessToken, { ...validOrder(), deadline: '2099-12-31' });

		expect(res.status).toBe(201);
		expect(res.body.data.order.deadline).toBe('2099-12-31');
	});

	it('без дедлайна поле равно null', async () => {
		const customer = await createCustomer();

		const res = await postOrder(customer.accessToken, validOrder());

		expect(res.status).toBe(201);
		expect(res.body.data.order.deadline).toBeNull();
	});

	it('дедлайн в прошлом: 400', async () => {
		const customer = await createCustomer();

		const res = await postOrder(customer.accessToken, { ...validOrder(), deadline: '2000-01-01' });

		expect(res.status).toBe(400);
	});

	it('дедлайн в неверном формате: 400', async () => {
		const customer = await createCustomer();

		const res = await postOrder(customer.accessToken, { ...validOrder(), deadline: '31.12.2099' });

		expect(res.status).toBe(400);
	});
});

describe('POST /orders: этапы', () => {
	const stage = (title, budget) => ({ title, budget });

	it('сохраняет этапы по порядку и отдаёт их в карточке заказа', async () => {
		const customer = await createCustomer();
		const body = {
			...validOrder(),
			budget: 300000,
			stages: [stage('Дизайн', 100000), stage('Вёрстка', 120000), stage('Запуск', 80000)],
		};

		const created = await postOrder(customer.accessToken, body);
		expect(created.status).toBe(201);

		const res = await getOrder(customer.accessToken, created.body.data.order.id);

		expect(res.status).toBe(200);
		expect(res.body.data.order.stages).toEqual([
			{ position: 1, title: 'Дизайн', budget: 100000 },
			{ position: 2, title: 'Вёрстка', budget: 120000 },
			{ position: 3, title: 'Запуск', budget: 80000 },
		]);
	});

	it('сумма этапов не равна бюджету: 400', async () => {
		const customer = await createCustomer();
		const body = {
			...validOrder(),
			budget: 300000,
			stages: [stage('Дизайн', 100000), stage('Вёрстка', 100000)],
		};

		const res = await postOrder(customer.accessToken, body);

		expect(res.status).toBe(400);
	});

	it('меньше двух этапов: 400', async () => {
		const customer = await createCustomer();
		const body = { ...validOrder(), budget: 100000, stages: [stage('Всё сразу', 100000)] };

		const res = await postOrder(customer.accessToken, body);

		expect(res.status).toBe(400);
	});

	it('больше десяти этапов: 400', async () => {
		const customer = await createCustomer();
		const stages = Array.from({ length: 11 }, (_, i) => stage(`Этап номер ${i + 1}`, 1000));
		const body = { ...validOrder(), budget: 11000, stages };

		const res = await postOrder(customer.accessToken, body);

		expect(res.status).toBe(400);
	});

	it('слишком короткое название этапа: 400', async () => {
		const customer = await createCustomer();
		const body = {
			...validOrder(),
			budget: 2000,
			stages: [stage('А', 1000), stage('Второй этап', 1000)],
		};

		const res = await postOrder(customer.accessToken, body);

		expect(res.status).toBe(400);
	});

	it('в списке этапы не отдаются', async () => {
		const customer = await createCustomer();
		await postOrder(customer.accessToken, {
			...validOrder(),
			budget: 2000,
			stages: [stage('Первый этап', 1000), stage('Второй этап', 1000)],
		});

		const res = await listOrders(customer.accessToken);

		expect(res.status).toBe(200);
		expect(res.body.data.items[0]).not.toHaveProperty('stages');
	});
});
describe('GET /orders: поиск по инструментам', () => {
	it('находит заказ по инструменту без учёта регистра и по части названия', async () => {
		const customer = await createCustomer();
		await postOrder(customer.accessToken, {
			...validOrder(),
			title: 'Разработка CRM',
			tools: ['React', 'Node.js'],
		});
		await postOrder(customer.accessToken, {
			...validOrder(),
			title: 'Лендинг для кафе',
			tools: ['Figma'],
		});

		const byFullName = await listOrders(customer.accessToken, { search: 'react' });
		const byPart = await listOrders(customer.accessToken, { search: 'node' });

		expect(byFullName.body.data.items.map((order) => order.title)).toEqual(['Разработка CRM']);
		expect(byPart.body.data.items.map((order) => order.title)).toEqual(['Разработка CRM']);
	});

	it('после изменения списка инструментов поиск находит по новым', async () => {
		const customer = await createCustomer();
		const created = await postOrder(customer.accessToken, {
			...validOrder(),
			title: 'Разработка CRM',
			tools: ['React'],
		});

		await request(app)
			.patch(`${ORDERS}/${created.body.data.order.id}`)
			.set(authHeader(customer.accessToken))
			.send({ tools: ['Vue.js'] });

		const oldTool = await listOrders(customer.accessToken, { search: 'react' });
		const newTool = await listOrders(customer.accessToken, { search: 'vue' });

		expect(oldTool.body.data.items).toHaveLength(0);
		expect(newTool.body.data.items).toHaveLength(1);
	});
});
const listMine = (token, query = {}) =>
	request(app).get(`${ORDERS}/mine`).set(authHeader(token)).query(query);

describe('GET /orders/mine: мои заказы', () => {
	it('возвращает мои заказы любого статуса и не показывает чужие', async () => {
		const me = await createCustomer('me@example.com');
		const other = await createCustomer('other@example.com');
		await insertOrder(me.id, { title: 'Мой открытый' });
		await insertOrder(me.id, { title: 'Мой отменённый', status: 'CANCELLED' });
		await insertOrder(other.id, { title: 'Чужой' });

		const res = await listMine(me.accessToken);

		expect(res.status).toBe(200);
		expect(res.body.data.items.map((order) => order.title).sort()).toEqual([
			'Мой открытый',
			'Мой отменённый',
		]);
		expect(res.body.data.total).toBe(2);
	});

	it('фильтрует по статусам', async () => {
		const me = await createCustomer();
		await insertOrder(me.id, { title: 'Открытый' });
		await insertOrder(me.id, { title: 'В работе', status: 'IN_PROGRESS' });
		await insertOrder(me.id, { title: 'Завершён', status: 'COMPLETED' });
		await insertOrder(me.id, { title: 'Отменён', status: 'CANCELLED' });

		const open = await listMine(me.accessToken, { status: 'OPEN' });
		const done = await listMine(me.accessToken, { status: 'COMPLETED,CANCELLED' });

		expect(open.body.data.items.map((order) => order.title)).toEqual(['Открытый']);
		expect(done.body.data.items.map((order) => order.title).sort()).toEqual([
			'Завершён',
			'Отменён',
		]);
	});

	it('исполнитель: 403', async () => {
		const freelancer = await createFreelancer();

		const res = await listMine(freelancer.accessToken);

		expect(res.status).toBe(403);
	});

	it('без токена: 401', async () => {
		const res = await request(app).get(`${ORDERS}/mine`);

		expect(res.status).toBe(401);
	});

	it('неизвестный статус: 400', async () => {
		const me = await createCustomer();

		const res = await listMine(me.accessToken, { status: 'HACKED' });

		expect(res.status).toBe(400);
	});

	it('разбивает на страницы', async () => {
		const me = await createCustomer();
		for (let i = 1; i <= 12; i++) {
			await insertOrder(me.id, { title: `Заказ номер ${i}` });
		}

		const res = await listMine(me.accessToken, { page: 2, limit: 5 });

		expect(res.body.data).toMatchObject({ total: 12, page: 2, limit: 5, pages: 3 });
		expect(res.body.data.items).toHaveLength(5);
	});
});

describe('PATCH /orders/:id: дедлайн и этапы', () => {
	const stagesFor = (first, second) => [
		{ title: 'Дизайн', budget: first },
		{ title: 'Вёрстка', budget: second },
	];

	const patch = (token, id, body) =>
		request(app).patch(`${ORDERS}/${id}`).set(authHeader(token)).send(body);

	const createWithStages = async (customer) => {
		const created = await postOrder(customer.accessToken, {
			...validOrder(),
			budget: 50000,
			stages: stagesFor(30000, 20000),
		});
		return created.body.data.order.id;
	};

	it('устанавливает и очищает дедлайн', async () => {
		const customer = await createCustomer();
		const created = await postOrder(customer.accessToken, validOrder());
		const id = created.body.data.order.id;

		const set = await patch(customer.accessToken, id, { deadline: '2099-01-01' });
		const cleared = await patch(customer.accessToken, id, { deadline: null });

		expect(set.body.data.order.deadline).toBe('2099-01-01');
		expect(cleared.body.data.order.deadline).toBeNull();
	});

	it('дедлайн в прошлом: 400', async () => {
		const customer = await createCustomer();
		const created = await postOrder(customer.accessToken, validOrder());

		const res = await patch(customer.accessToken, created.body.data.order.id, {
			deadline: '2000-01-01',
		});

		expect(res.status).toBe(400);
	});

	it('заменяет этапы, бюджет становится суммой этапов', async () => {
		const customer = await createCustomer();
		const id = await createWithStages(customer);

		const res = await patch(customer.accessToken, id, {
			stages: [
				{ title: 'Дизайн', budget: 10000 },
				{ title: 'Вёрстка', budget: 20000 },
				{ title: 'Тесты', budget: 30000 },
			],
		});

		expect(res.status).toBe(200);
		expect(res.body.data.order.budget).toBe(60000);
		expect(res.body.data.order.stages.map((item) => item.title)).toEqual([
			'Дизайн',
			'Вёрстка',
			'Тесты',
		]);
	});

	it('stages: null убирает этапы, бюджет можно менять', async () => {
		const customer = await createCustomer();
		const id = await createWithStages(customer);

		const res = await patch(customer.accessToken, id, { stages: null, budget: 70000 });

		expect(res.status).toBe(200);
		expect(res.body.data.order.stages).toEqual([]);
		expect(res.body.data.order.budget).toBe(70000);
	});

	it('сумма этапов не равна переданному бюджету: 400', async () => {
		const customer = await createCustomer();
		const id = await createWithStages(customer);

		const res = await patch(customer.accessToken, id, {
			budget: 100000,
			stages: stagesFor(30000, 20000),
		});

		expect(res.status).toBe(400);
		expect(errorFields(res)).toContain('budget');
	});

	it('у заказа есть этапы: менять только бюджет нельзя: 400', async () => {
		const customer = await createCustomer();
		const id = await createWithStages(customer);

		const res = await patch(customer.accessToken, id, { budget: 90000 });

		expect(res.status).toBe(400);
		const saved = await prisma.order.findUnique({ where: { id } });
		expect(saved.budget).toBe(50000);
	});
});
describe('Необязательные поля заказа', () => {
	it('создаёт заказ только с названием и инструментами', async () => {
		const customer = await createCustomer();

		const res = await postOrder(customer.accessToken, {
			title: 'Заказ без описания и бюджета',
			tools: ['React'],
		});

		expect(res.status).toBe(201);
		expect(res.body.data.order).toMatchObject({ description: null, budget: null });
	});

	it('с этапами без бюджета: бюджет равен сумме этапов', async () => {
		const customer = await createCustomer();

		const res = await postOrder(customer.accessToken, {
			title: 'Заказ с этапами',
			stages: [
				{ title: 'Дизайн', budget: 30000 },
				{ title: 'Вёрстка', budget: 20000 },
			],
		});

		expect(res.status).toBe(201);
		expect(res.body.data.order.budget).toBe(50000);
	});

	it('описание из пробелов: 400', async () => {
		const customer = await createCustomer();

		const res = await postOrder(customer.accessToken, {
			title: 'Заказ с пустым описанием',
			description: '   ',
		});

		expect(res.status).toBe(400);
	});

	it('описание и бюджет можно очистить при изменении', async () => {
		const customer = await createCustomer();
		const created = await postOrder(customer.accessToken, {
			title: 'Заказ с описанием и бюджетом',
			description: 'Подробное описание заказа',
			budget: 40000,
		});

		const res = await request(app)
			.patch(`${ORDERS}/${created.body.data.order.id}`)
			.set(authHeader(customer.accessToken))
			.send({ description: null, budget: null });

		expect(res.status).toBe(200);
		expect(res.body.data.order).toMatchObject({ description: null, budget: null });
	});

	it('заказы без бюджета видны без фильтра и не попадают под фильтр по бюджету', async () => {
		const customer = await createCustomer();
		await postOrder(customer.accessToken, { title: 'Без бюджета заказ' });
		await postOrder(customer.accessToken, { title: 'С бюджетом заказ', budget: 50000 });

		const all = await listOrders(customer.accessToken);
		const filtered = await listOrders(customer.accessToken, { budgetMin: 1000 });

		expect(all.body.data.items).toHaveLength(2);
		expect(filtered.body.data.items.map((order) => order.title)).toEqual(['С бюджетом заказ']);
	});
});

const respondTo = (token, id) =>
	request(app).post(`${ORDERS}/${id}/respond`).set(authHeader(token));
const chooseResponse = (token, orderId, responseId) =>
	request(app).post(`${ORDERS}/${orderId}/responses/${responseId}/select`).set(authHeader(token));
const dismissResponse = (token, orderId, responseId) =>
	request(app).post(`${ORDERS}/${orderId}/responses/${responseId}/reject`).set(authHeader(token));
const removeOrder = (token, id) => request(app).delete(`${ORDERS}/${id}`).set(authHeader(token));
const notificationsOf = (token, query = {}) =>
	request(app).get('/api/v1/notifications').set(authHeader(token)).query(query);

// id отклика конкретного исполнителя, глазами автора заказа
const responseIdOf = async (customer, orderId, freelancerId) => {
	const res = await getOrder(customer.accessToken, orderId);
	return res.body.data.order.responses.find((item) => item.freelancer.id === freelancerId).id;
};

describe('POST /orders/:id/respond: отклик', () => {
	it('исполнитель откликается: отклик сохранён, заказчик получил уведомление', async () => {
		const customer = await createCustomer();
		const freelancer = await createFreelancer();
		const order = await insertOrder(customer.id, { title: 'Заказ для отклика' });

		const res = await respondTo(freelancer.accessToken, order.id);

		expect(res.status).toBe(201);
		expect(res.body.data.order.myResponse.status).toBe('PENDING');
		expect(await prisma.orderResponse.count({ where: { orderId: order.id } })).toBe(1);
		const notifications = await notificationsOf(customer.accessToken);
		expect(notifications.body.data.items[0]).toMatchObject({
			type: 'ORDER_RESPONSE',
			body: 'Заказ для отклика',
			orderId: order.id,
		});
	});

	it('повторный отклик: 409, отклик один', async () => {
		const customer = await createCustomer();
		const freelancer = await createFreelancer();
		const order = await insertOrder(customer.id);
		await respondTo(freelancer.accessToken, order.id);

		const res = await respondTo(freelancer.accessToken, order.id);

		expect(res.status).toBe(409);
		expect(await prisma.orderResponse.count()).toBe(1);
	});

	it('заказчик откликнуться не может: 403', async () => {
		const customer = await createCustomer();
		const order = await insertOrder(customer.id);

		const res = await respondTo(customer.accessToken, order.id);

		expect(res.status).toBe(403);
	});

	it('на не открытый заказ откликнуться нельзя: 404', async () => {
		const customer = await createCustomer();
		const freelancer = await createFreelancer();
		const order = await insertOrder(customer.id, { status: 'CANCELLED' });

		const res = await respondTo(freelancer.accessToken, order.id);

		expect(res.status).toBe(404);
		expect(await prisma.orderResponse.count()).toBe(0);
	});

	it('без токена: 401', async () => {
		const res = await request(app).post(`${ORDERS}/any-id/respond`);

		expect(res.status).toBe(401);
	});
});

describe('GET /orders/:id: отклики, статистика, просмотры', () => {
	it('автор видит откликнувшихся и статистику, исполнитель не видит ни того, ни другого', async () => {
		const customer = await createCustomer();
		const first = await createFreelancer('first@example.com');
		const second = await createFreelancer('second@example.com');
		const order = await insertOrder(customer.id);
		await respondTo(first.accessToken, order.id);
		await respondTo(second.accessToken, order.id);
		await putFavorite(first.accessToken, order.id);

		const forOwner = await getOrder(customer.accessToken, order.id);
		const forFreelancer = await getOrder(second.accessToken, order.id);

		expect(forOwner.body.data.order.responses).toHaveLength(2);
		expect(forOwner.body.data.order.stats).toMatchObject({ responses: 2, favorites: 1 });
		expect(forFreelancer.body.data.order.responses).toBeUndefined();
		expect(forFreelancer.body.data.order.stats).toBeUndefined();
	});

	it('просмотр считается один раз на исполнителя, автор не в счёт', async () => {
		const customer = await createCustomer();
		const freelancer = await createFreelancer();
		const order = await insertOrder(customer.id);

		await getOrder(freelancer.accessToken, order.id);
		await getOrder(freelancer.accessToken, order.id);
		await getOrder(customer.accessToken, order.id);
		const res = await getOrder(customer.accessToken, order.id);

		expect(res.body.data.order.stats.views).toBe(1);
	});

	it('в списке «мои заказы» есть число откликов, ждущих решения', async () => {
		const customer = await createCustomer();
		const first = await createFreelancer('first@example.com');
		const second = await createFreelancer('second@example.com');
		const order = await insertOrder(customer.id);
		await respondTo(first.accessToken, order.id);
		await respondTo(second.accessToken, order.id);
		const responseId = await responseIdOf(customer, order.id, second.id);
		await dismissResponse(customer.accessToken, order.id, responseId);

		const res = await listMine(customer.accessToken);

		expect(res.body.data.items[0].responsesCount).toBe(1);
	});
});

describe('POST /orders/:id/responses/:responseId/select: выбор исполнителя', () => {
	it('заказ переходит в работу, остальные отклики отклоняются, исполнитель получает уведомление', async () => {
		const customer = await createCustomer();
		const chosen = await createFreelancer('chosen@example.com');
		const other = await createFreelancer('other@example.com');
		const order = await insertOrder(customer.id, { title: 'Заказ в работу' });
		await respondTo(chosen.accessToken, order.id);
		await respondTo(other.accessToken, order.id);
		const responseId = await responseIdOf(customer, order.id, chosen.id);

		const res = await chooseResponse(customer.accessToken, order.id, responseId);

		expect(res.status).toBe(200);
		expect(res.body.data.order).toMatchObject({ status: 'IN_PROGRESS', executorId: chosen.id });
		const statuses = await prisma.orderResponse.findMany({ orderBy: { createdAt: 'asc' } });
		expect(statuses.map((item) => item.status)).toEqual(['SELECTED', 'REJECTED']);
		const notifications = await notificationsOf(chosen.accessToken);
		expect(notifications.body.data.items[0]).toMatchObject({
			type: 'EXECUTOR_SELECTED',
			title: 'Вы выбраны исполнителем!',
		});
	});

	it('выбранный исполнитель открывает заказ в работе, остальные получают 404', async () => {
		const customer = await createCustomer();
		const chosen = await createFreelancer('chosen@example.com');
		const other = await createFreelancer('other@example.com');
		const order = await insertOrder(customer.id);
		await respondTo(chosen.accessToken, order.id);
		const responseId = await responseIdOf(customer, order.id, chosen.id);
		await chooseResponse(customer.accessToken, order.id, responseId);

		const forChosen = await getOrder(chosen.accessToken, order.id);
		const forOther = await getOrder(other.accessToken, order.id);

		expect(forChosen.status).toBe(200);
		expect(forOther.status).toBe(404);
	});

	it('чужой заказчик выбрать не может: 403', async () => {
		const owner = await createCustomer('owner@example.com');
		const stranger = await createCustomer('stranger@example.com');
		const freelancer = await createFreelancer();
		const order = await insertOrder(owner.id);
		await respondTo(freelancer.accessToken, order.id);
		const responseId = await responseIdOf(owner, order.id, freelancer.id);

		const res = await chooseResponse(stranger.accessToken, order.id, responseId);

		expect(res.status).toBe(403);
		const saved = await prisma.order.findUnique({ where: { id: order.id } });
		expect(saved.status).toBe('OPEN');
	});

	it('отклик другого заказа не подходит: 404', async () => {
		const customer = await createCustomer();
		const freelancer = await createFreelancer();
		const first = await insertOrder(customer.id, { title: 'Первый заказ' });
		const second = await insertOrder(customer.id, { title: 'Второй заказ' });
		await respondTo(freelancer.accessToken, first.id);
		const responseId = await responseIdOf(customer, first.id, freelancer.id);

		const res = await chooseResponse(customer.accessToken, second.id, responseId);

		expect(res.status).toBe(404);
	});

	it('второй выбор у заказа в работе: 409', async () => {
		const customer = await createCustomer();
		const first = await createFreelancer('first@example.com');
		const second = await createFreelancer('second@example.com');
		const order = await insertOrder(customer.id);
		await respondTo(first.accessToken, order.id);
		await respondTo(second.accessToken, order.id);
		const firstId = await responseIdOf(customer, order.id, first.id);
		const secondId = await responseIdOf(customer, order.id, second.id);
		await chooseResponse(customer.accessToken, order.id, firstId);

		const res = await chooseResponse(customer.accessToken, order.id, secondId);

		expect(res.status).toBe(409);
	});

	it('исполнитель выбирать не может: 403', async () => {
		const customer = await createCustomer();
		const freelancer = await createFreelancer();
		const order = await insertOrder(customer.id);
		await respondTo(freelancer.accessToken, order.id);
		const responseId = await responseIdOf(customer, order.id, freelancer.id);

		const res = await chooseResponse(freelancer.accessToken, order.id, responseId);

		expect(res.status).toBe(403);
	});
});

describe('POST /orders/:id/responses/:responseId/reject: отклонение', () => {
	it('отклик отклонён и пропал из списка автора, повторно откликнуться нельзя', async () => {
		const customer = await createCustomer();
		const freelancer = await createFreelancer();
		const order = await insertOrder(customer.id);
		await respondTo(freelancer.accessToken, order.id);
		const responseId = await responseIdOf(customer, order.id, freelancer.id);

		const res = await dismissResponse(customer.accessToken, order.id, responseId);
		const again = await respondTo(freelancer.accessToken, order.id);

		expect(res.status).toBe(200);
		expect(res.body.data.order.responses).toHaveLength(0);
		expect(again.status).toBe(409);
	});

	it('чужой заказчик отклонить не может: 403', async () => {
		const owner = await createCustomer('owner@example.com');
		const stranger = await createCustomer('stranger@example.com');
		const freelancer = await createFreelancer();
		const order = await insertOrder(owner.id);
		await respondTo(freelancer.accessToken, order.id);
		const responseId = await responseIdOf(owner, order.id, freelancer.id);

		const res = await dismissResponse(stranger.accessToken, order.id, responseId);

		expect(res.status).toBe(403);
		const saved = await prisma.orderResponse.findFirst();
		expect(saved.status).toBe('PENDING');
	});

	it('уже отклонённый отклик: 409', async () => {
		const customer = await createCustomer();
		const freelancer = await createFreelancer();
		const order = await insertOrder(customer.id);
		await respondTo(freelancer.accessToken, order.id);
		const responseId = await responseIdOf(customer, order.id, freelancer.id);
		await dismissResponse(customer.accessToken, order.id, responseId);

		const res = await dismissResponse(customer.accessToken, order.id, responseId);

		expect(res.status).toBe(409);
	});
});

describe('DELETE /orders/:id: удаление', () => {
	it('автор удаляет открытый заказ вместе с откликами', async () => {
		const customer = await createCustomer();
		const freelancer = await createFreelancer();
		const order = await insertOrder(customer.id);
		await respondTo(freelancer.accessToken, order.id);

		const res = await removeOrder(customer.accessToken, order.id);

		expect(res.status).toBe(200);
		expect(await prisma.order.count()).toBe(0);
		expect(await prisma.orderResponse.count()).toBe(0);
	});

	it('снятый с публикации заказ удалить можно', async () => {
		const customer = await createCustomer();
		const order = await insertOrder(customer.id, { status: 'CANCELLED' });

		const res = await removeOrder(customer.accessToken, order.id);

		expect(res.status).toBe(200);
	});

	it('заказ в работе удалить нельзя: 409, заказ остаётся', async () => {
		const customer = await createCustomer();
		const order = await insertOrder(customer.id, { status: 'IN_PROGRESS' });

		const res = await removeOrder(customer.accessToken, order.id);

		expect(res.status).toBe(409);
		expect(await prisma.order.count()).toBe(1);
	});

	it('чужой заказ удалить нельзя: 403', async () => {
		const owner = await createCustomer('owner@example.com');
		const stranger = await createCustomer('stranger@example.com');
		const order = await insertOrder(owner.id);

		const res = await removeOrder(stranger.accessToken, order.id);

		expect(res.status).toBe(403);
		expect(await prisma.order.count()).toBe(1);
	});

	it('исполнитель удалить не может: 403', async () => {
		const customer = await createCustomer();
		const freelancer = await createFreelancer();
		const order = await insertOrder(customer.id);

		const res = await removeOrder(freelancer.accessToken, order.id);

		expect(res.status).toBe(403);
	});

	it('несуществующий заказ: 404', async () => {
		const customer = await createCustomer();

		const res = await removeOrder(customer.accessToken, 'no-such-id');

		expect(res.status).toBe(404);
	});
});

describe('/notifications: уведомления', () => {
	const makeNotification = (userId, overrides = {}) =>
		prisma.notification.create({
			data: {
				userId,
				type: 'ORDER_RESPONSE',
				title: 'Новый отклик на заказ',
				body: 'Заказ',
				...overrides,
			},
		});

	it('возвращает только мои уведомления и число непрочитанных', async () => {
		const me = await createCustomer('me@example.com');
		const other = await createCustomer('other@example.com');
		await makeNotification(me.id);
		await makeNotification(me.id, { readAt: new Date() });
		await makeNotification(other.id);

		const res = await notificationsOf(me.accessToken);

		expect(res.status).toBe(200);
		expect(res.body.data.items).toHaveLength(2);
		expect(res.body.data.unread).toBe(1);
	});

	it('отмечает уведомление прочитанным', async () => {
		const me = await createCustomer();
		const item = await makeNotification(me.id);

		const res = await request(app)
			.post(`/api/v1/notifications/${item.id}/read`)
			.set(authHeader(me.accessToken));

		expect(res.status).toBe(200);
		const saved = await prisma.notification.findUnique({ where: { id: item.id } });
		expect(saved.readAt).not.toBeNull();
	});

	it('чужое уведомление прочитать нельзя: 404, оно не меняется', async () => {
		const me = await createCustomer('me@example.com');
		const other = await createCustomer('other@example.com');
		const item = await makeNotification(other.id);

		const res = await request(app)
			.post(`/api/v1/notifications/${item.id}/read`)
			.set(authHeader(me.accessToken));

		expect(res.status).toBe(404);
		const saved = await prisma.notification.findUnique({ where: { id: item.id } });
		expect(saved.readAt).toBeNull();
	});

	it('«прочитать все» затрагивает только мои', async () => {
		const me = await createCustomer('me@example.com');
		const other = await createCustomer('other@example.com');
		await makeNotification(me.id);
		await makeNotification(me.id);
		await makeNotification(other.id);

		await request(app).post('/api/v1/notifications/read-all').set(authHeader(me.accessToken));

		const mine = await notificationsOf(me.accessToken);
		const theirs = await notificationsOf(other.accessToken);
		expect(mine.body.data.unread).toBe(0);
		expect(theirs.body.data.unread).toBe(1);
	});

	it('без токена: 401', async () => {
		const res = await request(app).get('/api/v1/notifications');

		expect(res.status).toBe(401);
	});
});
