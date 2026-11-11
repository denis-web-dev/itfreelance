import prisma from '../../../lib/prisma.js';
import ApiError from '../../../utils/ApiError.js';

const select = {
	id: true,
	type: true,
	title: true,
	body: true,
	orderId: true,
	readAt: true,
	createdAt: true,
};

export const listNotifications = async (userId, { page, limit }) => {
	const where = { userId };

	const [total, unread, items] = await prisma.$transaction([
		prisma.notification.count({ where }),
		prisma.notification.count({ where: { userId, readAt: null } }),
		prisma.notification.findMany({
			where,
			orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
			skip: (page - 1) * limit,
			take: limit,
			select,
		}),
	]);

	return { items, total, unread, page, limit, pages: Math.ceil(total / limit) };
};

// Ищем только среди своих: чужое уведомление для пользователя «не существует»
export const markRead = async (userId, notificationId) => {
	const found = await prisma.notification.findFirst({
		where: { id: notificationId, userId },
		select: { id: true },
	});
	if (!found) throw ApiError.notFound('Уведомление не найдено');

	await prisma.notification.updateMany({
		where: { id: notificationId, userId, readAt: null },
		data: { readAt: new Date() },
	});
};

export const markAllRead = async (userId) => {
	await prisma.notification.updateMany({
		where: { userId, readAt: null },
		data: { readAt: new Date() },
	});
};
