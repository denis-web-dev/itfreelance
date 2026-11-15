import prisma from '../../../lib/prisma.js';
import ApiError from '../../../utils/ApiError.js';

const participantWhere = (userId) => ({
	OR: [{ customerId: userId }, { freelancerId: userId }],
});

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

// Ищем только среди своих чатов: чужой чат для пользователя «не существует»
const findMine = async (userId, conversationId) => {
	const conversation = await prisma.conversation.findFirst({
		where: { id: conversationId, ...participantWhere(userId) },
		select: { id: true, order: { select: { status: true } } },
	});
	if (!conversation) throw ApiError.notFound('Чат не найден');
	return conversation;
};

export const listConversations = async (userId) => {
	const rows = await prisma.conversation.findMany({
		where: participantWhere(userId),
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

	// Непрочитанные по всем чатам одним запросом
	const unreadRows = await prisma.message.groupBy({
		by: ['conversationId'],
		where: { senderId: { not: userId }, readAt: null, conversation: participantWhere(userId) },
		_count: { _all: true },
	});
	const unread = Object.fromEntries(unreadRows.map((row) => [row.conversationId, row._count._all]));

	return rows.map((row) => ({
		id: row.id,
		orderId: row.orderId,
		orderTitle: row.order.title,
		orderStatus: row.order.status,
		partner: toPartner(row.customer.id === userId ? row.freelancer : row.customer),
		lastMessage: row.messages[0] ?? null,
		unread: unread[row.id] ?? 0,
	}));
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
		prisma.conversation.update({
			where: { id: conversationId },
			data: { lastMessageAt: new Date() },
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
