import express from 'express';
import cors from 'cors';
import { authRateLimiter } from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './api/v1/auth/auth.routes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting для auth (защита от брута)
app.use('/api/v1/auth', authRateLimiter);

// Роуты с версионированием
app.use('/api/v1/auth', authRoutes);

// Обработка 404
app.use((req, res) => {
	res.status(404).json({ success: false, message: 'Маршрут не найден' });
});

// Глобальный обработчик ошибок (самый последний!)
app.use(errorHandler);

export default app;
