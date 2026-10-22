import prisma from '../../../lib/prisma.js';
import ApiError from '../../../utils/ApiError.js';

const customerSelect = {
	select: {
		id: true,
		profile: {
			select: { fullName: true, companyName: true, ratingAvg: true, ratingCount: true },
		},
	},
};

// userId нужен, чтобы подтянуть только СВОИ сердечки, а не чужие
const orderSelectFor = (userId) => ({
	id: true,
	title: true,
	description: true,
	budget: true,
	tools: true,
	status: true,
	deadline: true,
	createdAt: true,
	updatedAt: true,
	customer: customerSelect,
	favorites: { where: { userId }, select: { userId: true } },
});

// В списке полное описание не отдаём: оно длинное и в карточке не нужно
const listSelectFor = (userId) => ({ ...orderSelectFor(userId), description: false });

const stagesSelect = {
	select: { position: true, title: true, budget: true },
	orderBy: { position: 'asc' },
};

// Этапы нужны только в карточке заказа, в списке их нет
const detailSelectFor = (userId) => ({ ...orderSelectFor(userId), stages: stagesSelect });

const EDITABLE_FIELDS = ['title', 'description', 'budget', 'tools'];

const pick = (source, keys) =>
	Object.fromEntries(
		keys.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]),
	);

const toDto = ({ customer, favorites, deadline, ...order }) => ({
	...order,
	deadline: deadline ? deadline.toISOString().slice(0, 10) : null,
	isFavorite: (favorites?.length ?? 0) > 0,
	customer: {
		id: customer.id,
		name: customer.profile?.companyName || customer.profile?.fullName || 'Заказчик',
		rating: customer.profile?.ratingAvg ?? null,
		reviewsCount: customer.profile?.ratingCount ?? 0,
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
			deadline: input.deadline ? new Date(input.deadline) : null,
			stages: input.stages
				? {
						create: input.stages.map((item, index) => ({
							position: index + 1,
							title: item.title,
							budget: item.budget,
						})),
					}
				: undefined,
		},
				select: detailSelectFor(customerId),
	});
	return toDto(order);
};

// Экранируем служебные символы LIKE, чтобы % и _ искались как обычные символы
const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');

export const listOrders = async (
	userId,
	{ budgetMin, budgetMax, minRating, tools, search, page, limit },
) => {
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
	if (minRating !== undefined) {
		where.customer = { profile: { ratingAvg: { gte: minRating } } };
	}

	const [total, items] = await prisma.$transaction([
		prisma.order.count({ where }),
		prisma.order.findMany({
			where,
			// id во второй сортировке даёт стабильный порядок при одинаковом времени
			orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
			skip: (page - 1) * limit,
			take: limit,
			select: listSelectFor(userId),
		}),
	]);

	return { items: items.map(toDto), total, page, limit, pages: Math.ceil(total / limit) };
};

// Вкладка «Избранное»: мои сердечки, самые свежие сверху.
// Показываем только открытые заказы: чужой отменённый заказ видеть нельзя
export const listFavoriteOrders = async (userId, { page, limit }) => {
	const where = { userId, order: { status: 'OPEN' } };

	const [total, rows] = await prisma.$transaction([
		prisma.favoriteOrder.count({ where }),
		prisma.favoriteOrder.findMany({
			where,
			orderBy: [{ createdAt: 'desc' }, { orderId: 'desc' }],
			skip: (page - 1) * limit,
			take: limit,
			select: { order: { select: listSelectFor(userId) } },
		}),
	]);

	return {
		items: rows.map((row) => toDto(row.order)),
		total,
		page,
		limit,
		pages: Math.ceil(total / limit),
	};
};

export const getOrder = async (orderId, viewer) => {
	const order = await prisma.order.findUnique({
		where: { id: orderId },
				select: detailSelectFor(viewer.id),
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
