import sharp from 'sharp';
import ApiError from '../utils/ApiError.js';

const ALLOWED_FORMATS = ['jpeg', 'png', 'webp'];
const MAX_SIDE = 1600; // длинная сторона после обработки
const MAX_PIXELS = 24_000_000; // защита от «бомб»: маленький файл с огромным числом пикселей

export const processImage = async (buffer) => {
	try {
		const image = sharp(buffer, { limitInputPixels: MAX_PIXELS });
		const { format } = await image.metadata(); // формат по содержимому

		if (!ALLOWED_FORMATS.includes(format)) {
			throw ApiError.badRequest('Допустимы только JPEG, PNG и WebP');
		}

		return await image
			.rotate() // учитываем ориентацию из EXIF, потом метаданные не сохраняем
			.resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
			.webp({ quality: 82 })
			.toBuffer();
	} catch (error) {
		if (error instanceof ApiError) throw error;
		throw ApiError.badRequest('Не удалось обработать изображение. Загрузите JPEG, PNG или WebP');
	}
};
