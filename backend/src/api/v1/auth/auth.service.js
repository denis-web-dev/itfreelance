import prisma from '../../../lib/prisma.js';
import { hashPassword, comparePassword } from '../../../utils/hash.js';
import {
	generateAccessToken,
	generateRefreshToken,
	verifyRefreshToken,
} from '../../../config/jwt.config.js';
import ApiError from '../../../utils/ApiError.js';

/**
 * Регистрация нового пользователя
 * Создаёт запись в users + profiles и выдаёт токены
 */
export const registerUser = async ({ email, password, role, fullName }) => {
	// Проверяем, не занят ли email
	const existingUser = await prisma.user.findUnique({ where: { email } });
	if (existingUser) {
		throw ApiError.conflict('Пользователь с таким email уже существует');
	}

	// Хэшируем пароль (12 раундов — современный стандарт)
	const passwordHash = await hashPassword(password);

	// Создаём пользователя + профиль в одной транзакции
	const user = await prisma.user.create({
		data: {
			email,
			passwordHash,
			role, // FREELANCER или CUSTOMER
			profile: {
				create: {
					fullName: fullName || null,
				},
			},
		},
		include: {
			profile: true,
		},
	});

	const payload = { userId: user.id, role: user.role };

	const accessToken = generateAccessToken(payload);
	const refreshToken = generateRefreshToken(payload);

	// Сохраняем refresh-токен в БД (чтобы можно было отозвать)
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + 7); // 7 дней

	await prisma.refreshToken.create({
		data: {
			token: refreshToken,
			userId: user.id,
			expiresAt,
		},
	});

	return {
		user: {
			id: user.id,
			email: user.email,
			role: user.role,
			fullName: user.profile?.fullName,
		},
		tokens: {
			accessToken,
			refreshToken,
		},
	};
};

/**
 * Вход пользователя
 */
export const loginUser = async ({ email, password }) => {
	const user = await prisma.user.findUnique({
		where: { email },
		include: { profile: true },
	});

	if (!user || !user.isActive) {
		throw ApiError.unauthorized('Неверный email или пароль');
	}

	const isPasswordValid = await comparePassword(password, user.passwordHash);
	if (!isPasswordValid) {
		throw ApiError.unauthorized('Неверный email или пароль');
	}

	const payload = { userId: user.id, role: user.role };
	const accessToken = generateAccessToken(payload);
	const refreshToken = generateRefreshToken(payload);

	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + 7);

	await prisma.refreshToken.create({
		data: {
			token: refreshToken,
			userId: user.id,
			expiresAt,
		},
	});

	return {
		user: {
			id: user.id,
			email: user.email,
			role: user.role,
			fullName: user.profile?.fullName,
		},
		tokens: {
			accessToken,
			refreshToken,
		},
	};
};

/**
 * Обновление access-токена через refresh-токен
 */
export const refreshTokens = async (refreshToken) => {
	let payload;
	try {
		payload = verifyRefreshToken(refreshToken);
	} catch {
		throw ApiError.unauthorized('Невалидный refresh token');
	}

	const storedToken = await prisma.refreshToken.findUnique({
		where: { token: refreshToken },
	});

	if (!storedToken || storedToken.expiresAt < new Date()) {
		throw ApiError.unauthorized('Refresh token истёк или не найден');
	}

	// Удаляем старый refresh-токен (одноразовый)
	await prisma.refreshToken.delete({ where: { token: refreshToken } });

	const newPayload = { userId: payload.userId, role: payload.role };
	const newAccessToken = generateAccessToken(newPayload);
	const newRefreshToken = generateRefreshToken(newPayload);

	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + 7);

	await prisma.refreshToken.create({
		data: {
			token: newRefreshToken,
			userId: payload.userId,
			expiresAt,
		},
	});

	return {
		accessToken: newAccessToken,
		refreshToken: newRefreshToken,
	};
};

/**
 * Выход — удаляем refresh-токен
 */
export const logoutUser = async (refreshToken) => {
	if (refreshToken) {
		await prisma.refreshToken.deleteMany({
			where: { token: refreshToken },
		});
	}
};
