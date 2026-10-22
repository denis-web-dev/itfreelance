import multer from 'multer';
import ApiError from '../utils/ApiError.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 МБ
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 5 },
	// Грубый первый фильтр. Настоящая проверка по содержимому в image.js
	fileFilter: (req, file, cb) => {
		if (!ALLOWED_MIME.includes(file.mimetype)) {
			return cb(ApiError.badRequest('Допустимы только JPEG, PNG и WebP'));
		}
		cb(null, true);
	},
});

// Превращаем ошибки multer в наши ApiError, чтобы ответ был в привычном формате
export const uploadImage = (fieldName) => (req, res, next) => {
	upload.single(fieldName)(req, res, (error) => {
		if (!error) return next();
		if (error instanceof multer.MulterError) {
			if (error.code === 'LIMIT_FILE_SIZE') {
				return next(new ApiError(413, 'Файл больше 5 МБ'));
			}
			return next(ApiError.badRequest('Некорректная загрузка файла'));
		}
		next(error);
	});
};
