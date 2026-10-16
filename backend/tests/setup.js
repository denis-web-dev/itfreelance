import dotenv from 'dotenv';
import { afterAll } from 'vitest';

// Тестовые переменные перекрывают обычные из .env
dotenv.config({ path: '.env.test', override: true, quiet: true });
process.env.NODE_ENV = 'test';

// Защита: тесты очищают таблицы, поэтому работают только с базой, имя которой оканчивается на _test
const databaseUrl = process.env.DATABASE_URL ?? '';
const databaseName = /\/([^/?]+)(?:\?|$)/.exec(databaseUrl)?.[1] ?? '';

if (!databaseName.endsWith('_test')) {
	throw new Error(
		`Тесты запускаются только на базе с именем на "_test". Сейчас: "${databaseName || 'не задана'}"`,
	);
}

const { default: prisma } = await import('../src/lib/prisma.js');

afterAll(async () => {
	await prisma.$disconnect();
});
