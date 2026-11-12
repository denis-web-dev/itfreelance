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

// Что видно о пользователе другим. Явный белый список: новая колонка в таблице
// не попадёт наружу случайно
const PUBLIC_PROFILE_FIELDS = [
	'fullName',
	'companyName',
	'region',
	'sphere',
	'about',
	'site',
	'skills',
	'tools',
	'avatarUrl',
	'experience',
	'rate',
	'marketYears',
	'ratingAvg',
	'ratingCount',
];

// Контакты открываются только после выбора исполнителя (или самому владельцу профиля)
const CONTACT_PROFILE_FIELDS = ['phone', 'telegram', 'vk'];

export const getPublicProfile = async (viewerId, targetId) => {
	const target = await prisma.user.findUnique({
		where: { id: targetId },
		select: { id: true, email: true, role: true, isActive: true },
	});
	// Заблокированных и служебные аккаунты для остальных «не существует»
	if (!target || !target.isActive || target.role === 'ADMIN') {
		throw ApiError.notFound('Пользователь не найден');
	}

	// Контакты видны владельцу и тем, кто связан выбором исполнителя в любом из заказов
	const isSelf = viewerId === targetId;
	const linkedByOrder = isSelf
		? null
		: await prisma.order.findFirst({
				where: {
					OR: [
						{ customerId: viewerId, executorId: targetId },
						{ customerId: targetId, executorId: viewerId },
					],
				},
				select: { id: true },
			});
	const canSeeContacts = isSelf || linkedByOrder !== null;

	const profile = await prisma.profile.findUnique({ where: { userId: targetId } });
	const visibleKeys = canSeeContacts
		? [...PUBLIC_PROFILE_FIELDS, ...CONTACT_PROFILE_FIELDS]
		: PUBLIC_PROFILE_FIELDS;

	return {
		user: { id: target.id, role: target.role, ...(canSeeContacts ? { email: target.email } : {}) },
		profile: profile ? pick(profile, visibleKeys) : null,
		canSeeContacts,
	};
};
