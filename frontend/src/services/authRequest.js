import { request, ApiError } from './api';
import { refreshTokens } from './auth';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './tokens';

// Общее обновление токенов для всех параллельных запросов
let refreshPromise = null;

const refreshSession = async () => {
	const refreshToken = getRefreshToken();
	if (!refreshToken) throw new ApiError('Требуется вход', 401);

	const result = await refreshTokens(refreshToken);
	saveTokens(result.data);
};

export async function authRequest(path, options = {}) {
	const withToken = () => ({
		...options,
		headers: { ...options.headers, Authorization: `Bearer ${getAccessToken()}` },
	});

	try {
		return await request(path, withToken());
	} catch (error) {
		if (error.status !== 401) throw error;

		// Access-токен истёк: пробуем обновить сессию и повторяем запрос один раз
		try {
			refreshPromise ??= refreshSession().finally(() => {
				refreshPromise = null;
			});
			await refreshPromise;
		} catch {
			clearTokens();
			throw new ApiError('Сессия истекла. Войдите снова.', 401);
		}
		return request(path, withToken());
	}
}
