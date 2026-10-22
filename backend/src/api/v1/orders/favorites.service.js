import prisma from '../../../lib/prisma.js';
import ApiError from '../../../utils/ApiError.js';

// upsert: повторный вызов ничего не ломает
export const addFavorite = async (userId, orderId) => {
	const order = await prisma.order.findUnique({
		where: { id: orderId },
		select: { id: true, status: true },
	});
	// Не открытые заказы для исполнителя «не существуют», как и в getOrder
	if (!order || order.status !== 'OPEN') throw ApiError.notFound('Заказ не найден');

	await prisma.favoriteOrder.upsert({
		where: { userId_orderId: { userId, orderId } },
		create: { userId, orderId },
		update: {},
	});
};

// deleteMany не падает, если записи нет
export const removeFavorite = async (userId, orderId) => {
	await prisma.favoriteOrder.deleteMany({ where: { userId, orderId } });
};
