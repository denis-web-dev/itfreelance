import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
	definition: {
		openapi: '3.0.0',
		info: { title: 'Freelance Birzha API v1', version: '1.0.0' },
		servers: [{ url: 'http://localhost:5000' }],
	},
	apis: ['./src/api/v1/**/*.js'],
};

const specs = swaggerJsdoc(options);
export { swaggerUi, specs };
