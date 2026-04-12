import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import ApiError from '../../../utils/ApiError.js';
import { jwtConfig } from '../../../config/jwt.config.js';

const prisma = new PrismaClient();

export const registerUser = async ({ name, email, password }) => {
	// Проверяем, существует ли пользователь
	const existingUser = await prisma.user.findUnique({ where: { email } });
	if (existingUser) {
		throw ApiError.conflict('Пользователь с таким email уже существует');
	}

	// Хэшируем пароль
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);

	// Создаём пользователя
	const user = await prisma.user.create({
		data: {
			name,
			email,
			password: hashedPassword,
		},
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			createdAt: true,
		},
	});

	// Генерируем токены
	const tokens = generateTokens(user.id);

	return { user, tokens };
};

// Вспомогательная функция генерации токенов
const generateTokens = (userId) => {
	const accessToken = jwt.sign({ id: userId }, jwtConfig.access.secret, { expiresIn: jwtConfig.access.expiresIn });

	const refreshToken = jwt.sign({ id: userId }, jwtConfig.refresh.secret, { expiresIn: jwtConfig.refresh.expiresIn });

	return { accessToken, refreshToken };
};
