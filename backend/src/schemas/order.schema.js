import { z } from 'zod';

const MAX_BUDGET = 100_000_000;
const MAX_STAGES = 10;

const title = z
	.string()
	.trim()
	.min(5, 'Название не короче 5 символов')
	.max(150, 'Название не длиннее 150 символов');

// Описание необязательное; если заполнено, то не пустое
const description = z
	.string()
	.trim()
	.min(1, 'Описание не может быть пустым')
	.max(5000, 'Описание не длиннее 5000 символов');

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

// Если бюджет указан вместе с этапами, он должен равняться их сумме
const stagesMatchBudget = (data) =>
	!data.stages ||
	data.budget == null ||
	data.stages.reduce((sum, item) => sum + item.budget, 0) === data.budget;

const stagesMatchBudgetIssue = {
	message: 'Сумма бюджетов этапов должна равняться бюджету заказа',
	path: ['budget'],
};

// Создание: обязательны только название и (на стороне окна) инструменты
export const createOrderSchema = z
	.object({
		title,
		description: description.optional(),
		budget: budget.optional(),
		tools: tools.optional(),
		deadline: deadline.optional(),
		stages: stages.optional(),
	})
	.refine(stagesMatchBudget, stagesMatchBudgetIssue);

// Изменение: любые поля, но хотя бы одно.
// null очищает описание, бюджет, дедлайн или разбивку на этапы
export const updateOrderSchema = z
	.object({
		title,
		description: description.nullable(),
		budget: budget.nullable(),
		tools,
		deadline: deadline.nullable(),
		stages: stages.nullable(),
	})
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		message: 'Укажите хотя бы одно поле для изменения',
	})
	.refine(stagesMatchBudget, stagesMatchBudgetIssue);

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

const ORDER_STATUSES = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

// Мои заказы: ?status=OPEN,IN_PROGRESS (пусто = любые), плюс страница и размер страницы
export const listMyOrdersQuerySchema = z.object({
	status: z
		.string()
		.trim()
		.max(100)
		.optional()
		.transform((value) =>
			value
				? value
						.split(',')
						.map((item) => item.trim())
						.filter(Boolean)
				: [],
		)
		.pipe(z.array(z.enum(ORDER_STATUSES, 'Неизвестный статус заказа'))),
	page: intParam(1, 100000).default(1),
	limit: intParam(1, 50).default(10),
});
