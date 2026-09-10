import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'Freelance Birzha API v1',
			version: '1.0.0',
			description:
				'REST API для фриланс-биржи с версионированием\n\n' +
				'## Возможности:\n' +
				'- Регистрация и аутентификация пользователей\n' +
				'- JWT-токены (access + refresh)\n' +
				'- Защищённые маршруты\n' +
				'- Версионирование через URI (/api/v1/)',
		},
		servers: [
			{
				url: 'http://localhost:5000',
				description: 'Локальный сервер разработки',
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
					description: 'Введите токен в формате: Bearer <ваш_токен>',
				},
			},
		},
		security: [{ bearerAuth: [] }],
	},
	apis: ['./src/api/v1/**/*.js'],
};

const specs = swaggerJsdoc(options);
export { swaggerUi, specs };
