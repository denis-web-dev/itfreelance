import { z } from 'zod';

const emptyToUndefined = (value) => (value === '' ? undefined : value);
const intParam = (min, max) =>
	z.preprocess(emptyToUndefined, z.coerce.number().int().min(min).max(max));

export const listNotificationsQuerySchema = z.object({
	page: intParam(1, 100000).default(1),
	limit: intParam(1, 50).default(20),
});
