import express from 'express';
import cors from 'cors';
import { authRateLimiter } from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './api/v1/auth/auth.routes.js';
import { swaggerUi, specs } from './config/swagger.js';

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', authRateLimiter);
app.use('/api/v1/auth', authRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use((req, res) => res.status(404).json({ success: false, message: 'Маршрут не найден' }));
app.use(errorHandler);

export default app;
