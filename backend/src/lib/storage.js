import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

// Читаем переменную при каждом вызове, чтобы тесты могли подменить папку
export const uploadsDir = () => path.resolve(process.env.UPLOADS_DIR || 'uploads');
const portfolioDir = () => path.join(uploadsDir(), 'portfolio');

// Ключ всегда выглядит как uuid.webp: так в путь не попадёт ничего постороннего
const KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;

// Имя файла придумываем сами. Оригинальное имя от пользователя не используем нигде
export const saveImage = async (buffer) => {
	const key = `${randomUUID()}.webp`;
	await mkdir(portfolioDir(), { recursive: true });
	await writeFile(path.join(portfolioDir(), key), buffer, { flag: 'wx' });
	return key;
};

// Ошибка удаления файла не должна ломать запрос: файл-сирота хуже, чем упавший ответ
export const deleteImage = async (key) => {
	if (!KEY_PATTERN.test(key)) return;
	try {
		await unlink(path.join(portfolioDir(), key));
	} catch (error) {
		if (error.code !== 'ENOENT') console.error('Не удалось удалить файл:', error.message);
	}
};

export const publicUrl = (key) => `/uploads/portfolio/${key}`;
