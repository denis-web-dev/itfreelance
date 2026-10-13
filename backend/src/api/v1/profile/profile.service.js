import prisma from '../../../lib/prisma.js';
import ApiError from '../../../utils/ApiError.js';

const COMMON_FIELDS = [
	'fullName',
	'region',
	'phone',
	'sphere',
	'about',
	'site',
	'telegram',
	'vk',
	'skills',
	'tools',
];

// Какие поля может менять каждая роль (защита от записи чужих полей)
const ROLE_FIELDS = {
	FREELANCER: ['experience', 'rate'],
	CUSTOMER: ['companyName', 'marketYears'],
	ADMIN: [],
};

const pick = (source, keys) =>
	Object.fromEntries(
		keys.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]),
	);

const getActiveUser = async (userId) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { id: true, email: true, role: true, isActive: true },
	});
	if (!user || !user.isActive) {
		throw ApiError.unauthorized('Пользователь не найден');
	}
	return user;
};

export const getMyProfile = async (userId) => {
	const user = await getActiveUser(userId);
	const profile = await prisma.profile.findUnique({ where: { userId } });
	return {
		user: { id: user.id, email: user.email, role: user.role },
		profile,
	};
};

export const updateMyProfile = async (userId, input) => {
	const user = await getActiveUser(userId);
	const data = pick(input, [...COMMON_FIELDS, ...(ROLE_FIELDS[user.role] ?? [])]);

	const profile = await prisma.profile.upsert({
		where: { userId },
		update: data,
		create: { userId, ...data },
	});

	return {
		user: { id: user.id, email: user.email, role: user.role },
		profile,
	};
};
