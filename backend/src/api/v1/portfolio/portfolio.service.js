import prisma from '../../../lib/prisma.js';
import ApiError from '../../../utils/ApiError.js';
import { saveImage, deleteImage, publicUrl } from '../../../lib/storage.js';
import { processImage } from '../../../lib/image.js';

export const MAX_ITEMS = 12;

const select = { id: true, title: true, projectUrl: true, imageKey: true, createdAt: true };

// В ответ вместо ключа отдаём готовую ссылку на картинку
const toDto = ({ imageKey, ...item }) => ({ ...item, imageUrl: publicUrl(imageKey) });

export const listMyItems = async (userId) => {
	const items = await prisma.portfolioItem.findMany({
		where: { userId },
		orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
		select,
	});
	return items.map(toDto);
};

export const createItem = async (userId, input, file) => {
	if (!file) throw ApiError.badRequest('Прикрепите изображение проекта');

	const count = await prisma.portfolioItem.count({ where: { userId } });
	if (count >= MAX_ITEMS) {
		throw ApiError.conflict(`Можно добавить не более ${MAX_ITEMS} проектов`);
	}

	// Сначала обрабатываем и только потом пишем на диск
	const imageKey = await saveImage(await processImage(file.buffer));

	try {
		const item = await prisma.portfolioItem.create({
			data: {
				userId, // всегда из токена, не из тела запроса
				title: input.title.trim(),
				projectUrl: input.projectUrl.trim(),
				imageKey,
			},
			select,
		});
		return toDto(item);
	} catch (error) {
		await deleteImage(imageKey); // не оставляем файл без записи в базе
		throw error;
	}
};

export const updateItem = async (userId, itemId, input, file) => {
	const hasFields = input.title !== undefined || input.projectUrl !== undefined;
	if (!hasFields && !file) throw ApiError.badRequest('Укажите, что нужно изменить');

	// Ищем только среди своих: чужой проект для пользователя «не существует»
	const current = await prisma.portfolioItem.findFirst({
		where: { id: itemId, userId },
		select: { id: true, imageKey: true },
	});
	if (!current) throw ApiError.notFound('Проект не найден');

	const data = {};
	if (input.title !== undefined) data.title = input.title.trim();
	if (input.projectUrl !== undefined) data.projectUrl = input.projectUrl.trim();

	let newKey = null;
	if (file) {
		newKey = await saveImage(await processImage(file.buffer));
		data.imageKey = newKey;
	}

	try {
		const { count } = await prisma.portfolioItem.updateMany({
			where: { id: itemId, userId },
			data,
		});
		if (count === 0) throw ApiError.notFound('Проект не найден');
	} catch (error) {
		if (newKey) await deleteImage(newKey);
		throw error;
	}

	if (newKey) await deleteImage(current.imageKey); // старую картинку убираем после успеха

	const item = await prisma.portfolioItem.findFirst({ where: { id: itemId, userId }, select });
	return toDto(item);
};

export const deleteItem = async (userId, itemId) => {
	const current = await prisma.portfolioItem.findFirst({
		where: { id: itemId, userId },
		select: { id: true, imageKey: true },
	});
	if (!current) throw ApiError.notFound('Проект не найден');

	await prisma.portfolioItem.deleteMany({ where: { id: itemId, userId } });
	await deleteImage(current.imageKey);
};
