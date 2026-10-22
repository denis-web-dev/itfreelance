import { z } from 'zod';

const isHttpUrl = (value) => {
	try {
		return ['http:', 'https:'].includes(new URL(value).protocol);
	} catch {
		return false;
	}
};

const fields = {
	title: z
		.string('Укажите название')
		.trim()
		.min(2, 'Название не короче 2 символов')
		.max(100, 'Название не длиннее 100 символов'),
	projectUrl: z
		.string('Укажите ссылку на проект')
		.trim()
		.max(200, 'Ссылка не длиннее 200 символов')
		.refine(isHttpUrl, 'Введите корректную ссылку (http или https)'),
};

export const createPortfolioItemSchema = z.object(fields);

// При изменении поля необязательны (можно заменить только картинку)
export const updatePortfolioItemSchema = z.object(fields).partial();
