import prisma from '../../../lib/prisma.js';
import ApiError from '../../../utils/ApiError.js';

const customerSelect = {
	select: {
		id: true,
		profile: {
			select: {
				fullName: true,
				companyName: true,
				ratingAvg: true,
				ratingCount: true,
				avatarUrl: true,
				sphere: true,
				marketYears: true,
			},
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
	executorId: true,
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

const toDto = ({ customer, favorites, deadline, _count, ...order }) => ({
	...order,
	deadline: deadline ? deadline.toISOString().slice(0, 10) : null,
	isFavorite: (favorites?.length ?? 0) > 0,
	// Сколько откликов ждут решения: есть только в списке «мои заказы»
	...(_count ? { responsesCount: _count.responses } : {}),
	customer: {
		id: customer.id,
		name: customer.profile?.companyName || customer.profile?.fullName || 'Заказчик',
		rating: customer.profile?.ratingAvg ?? null,
		reviewsCount: customer.profile?.ratingCount ?? 0,
		avatarUrl: customer.profile?.avatarUrl ?? null,
		sphere: customer.profile?.sphere ?? null,
		marketYears: customer.profile?.marketYears ?? null,
	},
});

// Находит заказ и проверяет, что он принадлежит пользователю
const findOwnedOrder = async (orderId, userId) => {
	const order = await prisma.order.findUnique({
		where: { id: orderId },
		select: { id: true, customerId: true, title: true, status: true },
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
			description: input.description ?? null,
			// С этапами бюджет всегда равен сумме этапов; без этапов он необязателен
			budget: input.stages ? sumBudgets(input.stages) : (input.budget ?? null),
			tools: input.tools ?? [],
			toolsSearch: toolsToSearchText(input.tools),
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

// Инструменты одной строкой в нижнем регистре: по ней ищем без учёта регистра и по части слова
const toolsToSearchText = (tools = []) => tools.join(' ').toLowerCase();

const sumBudgets = (items) => items.reduce((sum, item) => sum + item.budget, 0);

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
			{ toolsSearch: { contains: pattern.toLowerCase() } },
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

// Мои заказы заказчика: любые статусы, самые свежие сверху
export const listMyOrders = async (userId, { status, page, limit }) => {
	const where = { customerId: userId };
	if (status?.length) where.status = { in: status };

	const [total, items] = await prisma.$transaction([
		prisma.order.count({ where }),
		prisma.order.findMany({
			where,
			orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
			skip: (page - 1) * limit,
			take: limit,
			select: {
				...listSelectFor(userId),
				// Только отклики, ждущие решения: по ним в карточке появляется «Выбрать исполнителя»
				_count: { select: { responses: { where: { status: 'PENDING' } } } },
			},
		}),
	]);

	return { items: items.map(toDto), total, page, limit, pages: Math.ceil(total / limit) };
};

const personSelect = {
	id: true,
	profile: {
		select: {
			fullName: true,
			avatarUrl: true,
			sphere: true,
			experience: true,
			ratingAvg: true,
			ratingCount: true,
		},
	},
};

const toPerson = ({ id, profile }) => ({
	id,
	name: profile?.fullName || 'Без имени',
	avatarUrl: profile?.avatarUrl ?? null,
	sphere: profile?.sphere ?? null,
	experience: profile?.experience ?? null,
	rating: profile?.ratingAvg ?? null,
	reviewsCount: profile?.ratingCount ?? 0,
});

// Только для автора: статистика и откликнувшиеся (отклонённые из списка уходят)
const loadOwnerExtras = async (orderId) => {
	const [responses, views, favorites] = await Promise.all([
		prisma.orderResponse.findMany({
			where: { orderId, status: { in: ['PENDING', 'SELECTED'] } },
			orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
			select: {
				id: true,
				status: true,
				createdAt: true,
				freelancer: { select: personSelect },
			},
		}),
		prisma.orderView.count({ where: { orderId } }),
		prisma.favoriteOrder.count({ where: { orderId } }),
	]);

	return {
		stats: { responses: responses.length, views, favorites },
		responses: responses.map(({ freelancer, ...response }) => ({
			...response,
			freelancer: toPerson(freelancer),
		})),
	};
};

export const getOrder = async (orderId, viewer) => {
	const order = await prisma.order.findUnique({
		where: { id: orderId },
		select: detailSelectFor(viewer.id),
	});

	// Не открытые заказы видят только автор и выбранный исполнитель, для остальных их нет
	const canSee =
		order &&
		(order.status === 'OPEN' || order.customer.id === viewer.id || order.executorId === viewer.id);
	if (!canSee) throw ApiError.notFound('Заказ не найден');

	const dto = toDto(order);

	if (order.customer.id === viewer.id) {
		Object.assign(dto, await loadOwnerExtras(orderId));
	} else if (viewer.role === 'FREELANCER') {
		dto.myResponse = await prisma.orderResponse.findUnique({
			where: { orderId_freelancerId: { orderId, freelancerId: viewer.id } },
			select: { id: true, status: true },
		});
	}
	return dto;
};

// Открытие страницы заказа. Просмотр считаем один раз на исполнителя; автор не в счёт
export const viewOrder = async (orderId, viewer) => {
	const order = await getOrder(orderId, viewer);
	if (viewer.role === 'FREELANCER') {
		await prisma.orderView.createMany({
			data: [{ orderId, userId: viewer.id }],
			skipDuplicates: true,
		});
	}
	return order;
};

export const updateOrder = async (userId, orderId, input) => {
	await findOwnedOrder(orderId, userId);

	const data = pick(input, EDITABLE_FIELDS);
	// Инструменты изменились, значит, обновляем и строку для поиска
	if (data.tools) data.toolsSearch = toolsToSearchText(data.tools);
	// null очищает дедлайн
	if (input.deadline !== undefined) {
		data.deadline = input.deadline ? new Date(input.deadline) : null;
	}

	// Массив заменяет этапы, null убирает их
	const changesStages = input.stages !== undefined;
	// С этапами бюджет заказа всегда равен сумме этапов
	if (input.stages) data.budget = sumBudgets(input.stages);

	// Всё в одной транзакции: либо изменилось и заказ, и этапы, либо ничего
	await prisma.$transaction(async (tx) => {
		// Бюджет заказа с этапами меняется только через этапы
		if (input.budget !== undefined && !changesStages) {
			const stagesCount = await tx.orderStage.count({ where: { orderId } });
			if (stagesCount > 0) {
				throw ApiError.badRequest('У заказа есть этапы: бюджет меняется через их сумму');
			}
		}

		// Условие status: 'OPEN' прямо в запросе защищает от гонки
		const { count } = await tx.order.updateMany({
			where: { id: orderId, customerId: userId, status: 'OPEN' },
			data,
		});
		if (count === 0) throw ApiError.conflict('Заказ нельзя изменить в текущем статусе');

		if (changesStages) {
			await tx.orderStage.deleteMany({ where: { orderId } });
			if (input.stages) {
				await tx.orderStage.createMany({
					data: input.stages.map((item, index) => ({
						orderId,
						position: index + 1,
						title: item.title,
						budget: item.budget,
					})),
				});
			}
		}
	});

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

// Отклик исполнителя на открытый заказ
export const respondToOrder = async (freelancerId, orderId) => {
	const order = await prisma.order.findUnique({
		where: { id: orderId },
		select: { id: true, title: true, status: true, customerId: true },
	});
	// Не открытый заказ для исполнителя «не существует»
	if (!order || order.status !== 'OPEN') throw ApiError.notFound('Заказ не найден');

	try {
		// Отклик и уведомление заказчику создаются вместе: либо оба, либо ничего
		await prisma.$transaction([
			prisma.orderResponse.create({ data: { orderId, freelancerId } }),
			prisma.notification.create({
				data: {
					userId: order.customerId,
					type: 'ORDER_RESPONSE',
					title: 'Новый отклик на заказ',
					body: order.title,
					orderId,
				},
			}),
		]);
	} catch (error) {
		// Уникальное ограничение: повторный отклик (в том числе после отклонения) невозможен
		if (error.code === 'P2002') throw ApiError.conflict('Вы уже откликнулись на этот заказ');
		throw error;
	}

	return getOrder(orderId, { id: freelancerId, role: 'FREELANCER' });
};

// Заказчик выбирает исполнителя: заказ переходит в работу, остальные отклики отклоняются
export const selectResponse = async (customerId, orderId, responseId) => {
	const order = await findOwnedOrder(orderId, customerId);

	await prisma.$transaction(async (tx) => {
		// Отклик ищем среди откликов именно этого заказа: чужой id не подойдёт
		const response = await tx.orderResponse.findFirst({
			where: { id: responseId, orderId },
			select: { id: true, status: true, freelancerId: true },
		});
		if (!response) throw ApiError.notFound('Отклик не найден');
		if (response.status === 'REJECTED') throw ApiError.conflict('Этот отклик уже отклонён');

		// Условие status: 'OPEN' в запросе защищает от гонки: два выбора разом не пройдут оба
		const { count } = await tx.order.updateMany({
			where: { id: orderId, customerId, status: 'OPEN' },
			data: { status: 'IN_PROGRESS', executorId: response.freelancerId },
		});
		if (count === 0) {
			throw ApiError.conflict('Исполнителя можно выбрать только у открытого заказа');
		}

		await tx.orderResponse.update({ where: { id: responseId }, data: { status: 'SELECTED' } });
		await tx.orderResponse.updateMany({
			where: { orderId, id: { not: responseId }, status: 'PENDING' },
			data: { status: 'REJECTED' },
		});
		await tx.notification.create({
			data: {
				userId: response.freelancerId,
				type: 'EXECUTOR_SELECTED',
				title: 'Вы выбраны исполнителем!',
				body: order.title,
				orderId,
			},
		});
	});

	return getOrder(orderId, { id: customerId });
};

// Заказчик отклоняет отклик (крестик)
export const rejectResponse = async (customerId, orderId, responseId) => {
	await findOwnedOrder(orderId, customerId);

	const { count } = await prisma.orderResponse.updateMany({
		where: { id: responseId, orderId, status: 'PENDING' },
		data: { status: 'REJECTED' },
	});
	if (count === 0) {
		const exists = await prisma.orderResponse.findFirst({
			where: { id: responseId, orderId },
			select: { id: true },
		});
		if (!exists) throw ApiError.notFound('Отклик не найден');
		throw ApiError.conflict('Этот отклик уже обработан');
	}

	return getOrder(orderId, { id: customerId });
};

// Полное удаление. Заказ в работе или завершённый удалять нельзя: к нему привяжутся
// сообщения, оплата и отзывы. Этапы, отклики, избранное и уведомления удаляются вместе с ним
export const deleteOrder = async (userId, orderId) => {
	await findOwnedOrder(orderId, userId);

	const { count } = await prisma.order.deleteMany({
		where: { id: orderId, customerId: userId, status: { in: ['OPEN', 'CANCELLED'] } },
	});
	if (count === 0) throw ApiError.conflict('Заказ в работе или завершённый удалить нельзя');
};
