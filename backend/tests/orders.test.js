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
		['budget', { budget: undefined }],
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
