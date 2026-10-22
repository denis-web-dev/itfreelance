import { z } from 'zod';

const MAX_BUDGET = 100_000_000;
const MAX_STAGES = 10;

const tools = z
	.array(
		z
			.string()
			.trim()
			.min(1, 'Название инструмента не может быть пустым')
			.max(50, 'Не более 50 символов'),
	)
	.max(20, 'Не более 20 инструментов');

const budget = z
	.number('Укажите бюджет числом')
	.int('Бюджет должен быть целым числом')
	.min(100, 'Минимальный бюджет 100 ₽')
	.max(MAX_BUDGET, 'Бюджет слишком большой');

// Одни и те же правила для создания и для изменения заказа
const orderFields = {
	title: z
		.string()
		.trim()
		.min(5, 'Название не короче 5 символов')
		.max(150, 'Название не длиннее 150 символов'),
	description: z
		.string()
		.trim()
		.min(20, 'Описание не короче 20 символов')
		.max(5000, 'Описание не длиннее 5000 символов'),
	budget,
	tools: tools.optional(),
};

const today = () => new Date().toISOString().slice(0, 10);

const deadline = z.iso
	.date('Укажите дату в формате ГГГГ-ММ-ДД')
	.refine((value) => value >= today(), 'Дедлайн не может быть в прошлом');

const stage = z.object({
	title: z
		.string()
		.trim()
		.min(2, 'Название этапа не короче 2 символов')
		.max(100, 'Название этапа не длиннее 100 символов'),
	budget,
});

const stages = z
	.array(stage)
	.min(2, 'Для разбивки нужно минимум 2 этапа')
	.max(MAX_STAGES, `Не более ${MAX_STAGES} этапов`);

export const createOrderSchema = z
	.object({ ...orderFields, deadline: deadline.optional(), stages: stages.optional() })
	.refine(
		(data) =>
			!data.stages || data.stages.reduce((sum, item) => sum + item.budget, 0) === data.budget,
		{ message: 'Сумма бюджетов этапов должна равняться бюджету заказа', path: ['budget'] },
	);

// При изменении можно прислать любые поля, но хотя бы одно
export const updateOrderSchema = z
	.object(orderFields)
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		message: 'Укажите хотя бы одно поле для изменения',
	});

// Параметры адресной строки приходят строками, поэтому приводим типы
const emptyToUndefined = (value) => (value === '' ? undefined : value);
const intParam = (min, max) =>
	z.preprocess(emptyToUndefined, z.coerce.number().int().min(min).max(max));

export const listOrdersQuerySchema = z
	.object({
		budgetMin: intParam(0, MAX_BUDGET).optional(),
		budgetMax: intParam(0, MAX_BUDGET).optional(),
		minRating: z.preprocess(emptyToUndefined, z.coerce.number().min(0).max(5)).optional(),
		// инструменты через запятую: ?tools=React,Vue.js
		tools: z
			.string()
			.trim()
			.max(500)
			.optional()
			.transform((value) =>
				value
					? value
							.split(',')
							.map((item) => item.trim())
							.filter(Boolean)
					: [],
			),
		search: z.string().trim().max(100).optional(),
		page: intParam(1, 100000).default(1),
		limit: intParam(1, 50).default(10),
	})
	.refine(
		(query) =>
			query.budgetMin === undefined ||
			query.budgetMax === undefined ||
			query.budgetMin <= query.budgetMax,
		{ message: 'budgetMin не может быть больше budgetMax', path: ['budgetMin'] },
	);
// Вкладка «Избранное»: только страница и размер страницы
export const listFavoritesQuerySchema = z.object({
	page: intParam(1, 100000).default(1),
	limit: intParam(1, 50).default(10),
});
