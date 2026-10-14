import prisma from '../../src/lib/prisma.js';

// Полная очистка перед каждым тестом; порядок важен: сначала зависимые таблицы
export const resetDb = async () => {
	await prisma.refreshToken.deleteMany();
	await prisma.profile.deleteMany();
	await prisma.user.deleteMany();
};

export { prisma };
