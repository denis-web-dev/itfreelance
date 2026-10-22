import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import profileRoutes from './api/v1/profile/profile.routes.js';
import portfolioRoutes from './api/v1/portfolio/portfolio.routes.js';
import { authRateLimiter } from './middleware/rateLimiter.js';
import ordersRoutes from './api/v1/orders/orders.routes.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './api/v1/auth/auth.routes.js';
import { swaggerUi, specs } from './config/swagger.js';
import { uploadsDir } from './lib/storage.js';

const app = express();

app.use(helmet());

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Загруженные файлы: имена случайные, список папок выключен, браузеру запрещено «угадывать» тип
app.use(
	'/uploads',
	express.static(uploadsDir(), {
		index: false,
		dotfiles: 'deny',
		maxAge: '1y',
		immutable: true, // имя файла уникальное, при замене картинки создаётся новый файл
		setHeaders: (res) => {
			res.setHeader('X-Content-Type-Options', 'nosniff');
			res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
		},
	}),
);

app.use('/api/v1/auth', authRateLimiter);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/portfolio', portfolioRoutes);
app.use('/api/v1/orders', ordersRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use((req, res) => res.status(404).json({ success: false, message: 'Маршрут не найден' }));
app.use(errorHandler);

export default app;
