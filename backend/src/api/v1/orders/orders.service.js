import prisma from '../../../lib/prisma.js';
import ApiError from '../../../utils/ApiError.js';

// Публичные данные заказчика: без e-mail и телефона
const customerSelect = {
	select: {
		id: true,
		profile: { select: { fullName: true, companyName: true } },
	},
};

const orderSelect = {
	id: true,
	title: true,
	description: true,
	budget: true,
	tools: true,
	status: true,
	createdAt: true,
	updatedAt: true,
	customer: customerSelect,
};

// В списке полное описание не отдаём: оно длинное и в карточке не нужно
const listSelect = { ...orderSelect, description: false };

const EDITABLE_FIELDS = ['title', 'description', 'budget', 'tools'];

const pick = (source, keys) =>
	Object.fromEntries(
		keys.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]),
	);

const toDto = ({ customer, ...order }) => ({
	...order,
	customer: {
		id: customer.id,
		name: customer.profile?.companyName || customer.profile?.fullName || 'Заказчик',
	},
});

// Находит заказ и проверяет, что он принадлежит пользователю
const findOwnedOrder = async (orderId, userId) => {
	const order = await prisma.order.findUnique({
		where: { id: orderId },
		select: { id: true, customerId: true },
	});
	if (!order) throw ApiError.notFound('Заказ не найден');
	if (order.customerId !== userId) throw ApiError.forbidden('Можно менять только свои заказы');
	return order;
};

export const createOrder = async (customerId, input) => {
	const order = await prisma.order.create({
		data: {
			customerId,
			title: input.title,
			description: input.description,
			budget: input.budget,
			tools: input.tools ?? [],
		},
		select: orderSelect,
	});
	return toDto(order);
};

// Экранируем служебные символы LIKE, чтобы % и _ искались как обычные символы
const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');

export const listOrders = async ({ budgetMin, budgetMax, tools, search, page, limit }) => {
	// В списке показываем только открытые заказы
	const where = { status: 'OPEN' };

	if (budgetMin !== undefined || budgetMax !== undefined) {
		where.budget = { gte: budgetMin, lte: budgetMax };
	}
	if (tools?.length) {
		where.tools = { hasSome: tools };
	}
	if (search) {
		const pattern = escapeLike(search);
		where.OR = [
			{ title: { contains: pattern, mode: 'insensitive' } },
			{ description: { contains: pattern, mode: 'insensitive' } },
		];
	}

	const [total, items] = await prisma.$transaction([
		prisma.order.count({ where }),
		prisma.order.findMany({
			where,
			// id во второй сортировке даёт стабильный порядок при одинаковом времени
			orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
			skip: (page - 1) * limit,
			take: limit,
			select: listSelect,
		}),
	]);

	return { items: items.map(toDto), total, page, limit, pages: Math.ceil(total / limit) };
};

export const getOrder = async (orderId, viewer) => {
	const order = await prisma.order.findUnique({
		where: { id: orderId },
		select: orderSelect,
	});

	// Не открытые заказы видит только автор, для остальных их как будто нет
	if (!order || (order.status !== 'OPEN' && order.customer.id !== viewer.id)) {
		throw ApiError.notFound('Заказ не найден');
	}
	return toDto(order);
};

export const updateOrder = async (userId, orderId, input) => {
	await findOwnedOrder(orderId, userId);

	// Условие status: 'OPEN' прямо в запросе защищает от гонки:
	// между проверкой и записью статус мог измениться
	const { count } = await prisma.order.updateMany({
		where: { id: orderId, customerId: userId, status: 'OPEN' },
		data: pick(input, EDITABLE_FIELDS),
	});
	if (count === 0) throw ApiError.conflict('Заказ нельзя изменить в текущем статусе');

	return getOrder(orderId, { id: userId });
};

export const cancelOrder = async (userId, orderId) => {
	await findOwnedOrder(orderId, userId);

	const { count } = await prisma.order.updateMany({
		where: { id: orderId, customerId: userId, status: 'OPEN' },
		data: { status: 'CANCELLED' },
	});
	if (count === 0) throw ApiError.conflict('Заказ нельзя отменить в текущем статусе');

	return getOrder(orderId, { id: userId });
};
