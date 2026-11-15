import prisma from '../../../lib/prisma.js';
import ApiError from '../../../utils/ApiError.js';

const participantWhere = (userId) => ({
	OR: [{ customerId: userId }, { freelancerId: userId }],
});

// Чаты, которые я не убирал из своего списка
const visibleWhere = (userId) => ({
	OR: [
		{ customerId: userId, customerHiddenAt: null },
		{ freelancerId: userId, freelancerHiddenAt: null },
	],
});

// Служебные символы LIKE ищем как обычные
const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');

const partnerSelect = {
	id: true,
	profile: { select: { fullName: true, companyName: true, avatarUrl: true } },
};

const toPartner = ({ id, profile }) => ({
	id,
	name: profile?.companyName || profile?.fullName || 'Пользователь',
	avatarUrl: profile?.avatarUrl ?? null,
});

const messageSelect = { id: true, senderId: true, text: true, createdAt: true, readAt: true };

const hiddenFieldFor = (conversation, userId) =>
	conversation.customerId === userId ? 'customerHiddenAt' : 'freelancerHiddenAt';

// Ищем только среди своих чатов: чужой чат для пользователя «не существует»
const findMine = async (userId, conversationId) => {
	const conversation = await prisma.conversation.findFirst({
		where: { id: conversationId, ...participantWhere(userId) },
		select: {
			id: true,
			customerId: true,
			freelancerId: true,
			order: { select: { status: true } },
		},
	});
	if (!conversation) throw ApiError.notFound('Чат не найден');
	return conversation;
};

export const listConversations = async (userId, { search } = {}) => {
	const conditions = [visibleWhere(userId)];

	if (search) {
		const contains = { contains: escapeLike(search), mode: 'insensitive' };
		const nameMatch = { OR: [{ fullName: contains }, { companyName: contains }] };
		conditions.push({
			OR: [
				{ order: { title: contains } },
				{ messages: { some: { text: contains } } },
				// Имя ищем только у собеседника, а не у себя
				{ customerId: userId, freelancer: { profile: nameMatch } },
				{ freelancerId: userId, customer: { profile: nameMatch } },
			],
		});
	}

	const rows = await prisma.conversation.findMany({
		where: { AND: conditions },
		orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
		take: 50,
		select: {
			id: true,
			orderId: true,
			order: { select: { title: true, status: true } },
			customer: { select: partnerSelect },
			freelancer: { select: partnerSelect },
			messages: {
				orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
				take: 1,
				select: { text: true, createdAt: true, senderId: true },
			},
		},
	});

	// Непрочитанные по всем видимым чатам одним запросом
	const unreadRows = await prisma.message.groupBy({
		by: ['conversationId'],
		where: { senderId: { not: userId }, readAt: null, conversation: visibleWhere(userId) },
		_count: { _all: true },
	});
	const unread = Object.fromEntries(unreadRows.map((row) => [row.conversationId, row._count._all]));

	return rows.map((row) => {
		const isCustomer = row.customer.id === userId;
		return {
			id: row.id,
			orderId: row.orderId,
			orderTitle: row.order.title,
			orderStatus: row.order.status,
			role: isCustomer ? 'CUSTOMER' : 'FREELANCER',
			partner: toPartner(isCustomer ? row.freelancer : row.customer),
			lastMessage: row.messages[0] ?? null,
			unread: unread[row.id] ?? 0,
		};
	});
};

// Карточка чата для страницы переписки
export const getConversation = async (userId, conversationId) => {
	const row = await prisma.conversation.findFirst({
		where: { id: conversationId, ...participantWhere(userId) },
		select: {
			id: true,
			customerId: true,
			customer: { select: partnerSelect },
			freelancer: { select: partnerSelect },
			order: {
				select: {
					id: true,
					title: true,
					status: true,
					budget: true,
					deadline: true,
					stages: {
						select: { position: true, title: true, budget: true },
						orderBy: { position: 'asc' },
					},
				},
			},
		},
	});
	if (!row) throw ApiError.notFound('Чат не найден');

	const isCustomer = row.customerId === userId;
	const { deadline, ...order } = row.order;
	return {
		id: row.id,
		role: isCustomer ? 'CUSTOMER' : 'FREELANCER',
		partner: toPartner(isCustomer ? row.freelancer : row.customer),
		order: { ...order, deadline: deadline ? deadline.toISOString().slice(0, 10) : null },
	};
};

// «Перейти в сообщения» из заказа: находим чат по заказу и возвращаем его в список, если он скрыт
export const openByOrder = async (userId, orderId) => {
	const conversation = await prisma.conversation.findFirst({
		where: { orderId, ...participantWhere(userId) },
		select: { id: true, customerId: true, freelancerId: true },
	});
	if (!conversation) throw ApiError.notFound('Чат не найден');

	await prisma.conversation.update({
		where: { id: conversation.id },
		data: { [hiddenFieldFor(conversation, userId)]: null },
	});
	return { id: conversation.id };
};

// «Удалить чат»: убирает его только из моего списка, история у собеседника остаётся
export const hideConversation = async (userId, conversationId) => {
	const conversation = await findMine(userId, conversationId);

	await prisma.$transaction([
		prisma.conversation.update({
			where: { id: conversationId },
			data: { [hiddenFieldFor(conversation, userId)]: new Date() },
		}),
		// Скрытый чат не должен оставлять «непрочитанных» у значка в шапке
		prisma.message.updateMany({
			where: { conversationId, senderId: { not: userId }, readAt: null },
			data: { readAt: new Date() },
		}),
	]);
};

// Последние сообщения по возрастанию (старые сверху)
export const listMessages = async (userId, conversationId, { limit }) => {
	await findMine(userId, conversationId);
	const rows = await prisma.message.findMany({
		where: { conversationId },
		orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
		take: limit,
		select: messageSelect,
	});
	return rows.reverse();
};

export const sendMessage = async (userId, conversationId, { text }) => {
	const conversation = await findMine(userId, conversationId);
	if (conversation.order.status !== 'IN_PROGRESS') {
		throw ApiError.conflict('Чат закрыт: заказ уже не в работе');
	}

	const [message] = await prisma.$transaction([
		prisma.message.create({
			data: { conversationId, senderId: userId, text },
			select: messageSelect,
		}),
		// Новое сообщение возвращает чат в список обоим участникам
		prisma.conversation.update({
			where: { id: conversationId },
			data: { lastMessageAt: new Date(), customerHiddenAt: null, freelancerHiddenAt: null },
		}),
	]);
	return message;
};

// Отмечаем прочитанными только сообщения собеседника
export const markRead = async (userId, conversationId) => {
	await findMine(userId, conversationId);
	await prisma.message.updateMany({
		where: { conversationId, senderId: { not: userId }, readAt: null },
		data: { readAt: new Date() },
	});
};

export const countUnread = async (userId) => {
	const count = await prisma.message.count({
		where: { senderId: { not: userId }, readAt: null, conversation: participantWhere(userId) },
	});
	return { count };
};
