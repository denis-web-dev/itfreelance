import { z } from 'zod';

const emptyToNull = (v) => (typeof v === 'string' ? v.trim() || null : v);

const text = (max) =>
	z.preprocess(emptyToNull, z.string().max(max, `Не более ${max} символов`).nullable().optional());

const phone = z.preprocess(
	emptyToNull,
	z
		.string()
		.regex(/^\+?[0-9\s()-]{10,20}$/, 'Введите корректный телефон')
		.nullable()
		.optional(),
);

const httpUrl = z.preprocess(
	emptyToNull,
	z
		.string()
		.max(200, 'Не более 200 символов')
		.refine((value) => {
			try {
				return ['http:', 'https:'].includes(new URL(value).protocol);
			} catch {
				return false;
			}
		}, 'Введите корректную ссылку (http или https)')
		.nullable()
		.optional(),
);

const tags = z
	.array(z.string().trim().min(1).max(50, 'Не более 50 символов'))
	.max(30, 'Не более 30 элементов')
	.optional();

const intOrNull = (max) => z.number().int().min(0).max(max).nullable().optional();

export const updateProfileSchema = z.object({
	fullName: z.string().trim().min(2, 'Введите имя и фамилию').max(100).optional(),
	region: text(100),
	phone,
	sphere: text(100),
	about: text(500),
	site: httpUrl,
	telegram: text(64),
	vk: text(100),
	skills: tags,
	tools: tags,
	// исполнитель
	experience: text(100),
	rate: intOrNull(1000000),
	// заказчик
	companyName: text(150),
	marketYears: intOrNull(200),
});
