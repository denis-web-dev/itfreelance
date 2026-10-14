import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		setupFiles: ['./tests/setup.js'],
		// Все файлы работают с одной тестовой базой, поэтому запускаем их по очереди
		fileParallelism: false,
		testTimeout: 15000,
	},
});
