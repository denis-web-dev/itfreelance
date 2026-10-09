import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
	console.log(`📌 Auth API: http://localhost:${PORT}/api/v1/auth`);
	console.log(`📖 Swagger: http://localhost:${PORT}/api-docs`);
});
