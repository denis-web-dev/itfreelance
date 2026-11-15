import { z } from 'zod';

const emptyToUndefined = (value) => (value === '' ? undefined : value);
const intParam = (min, max) =>
	z.preprocess(emptyToUndefined, z.coerce.number().int().min(min).max(max));

export const listMessagesQuerySchema = z.object({
	limit: intParam(1, 100).default(50),
});

export const sendMessageSchema = z.object({
	text: z
		.string('Введите сообщение')
		.trim()
		.min(1, 'Сообщение не может быть пустым')
		.max(2000, 'Сообщение не длиннее 2000 символов'),
});

export const listConversationsQuerySchema = z.object({
	search: z.string().trim().max(100).optional(),
});
