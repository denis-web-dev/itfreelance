import { authRequest } from './authRequest';

// Префикс пути должен быть таким же, как в profileApi.js:
// если там '/profile', оставь '/orders'; если '/api/v1/profile', поставь '/api/v1/orders'
const BASE = '/orders';

// Пустые значения не отправляем, массив (инструменты) склеиваем через запятую
const buildQuery = (params = {}) => {
	const query = new URLSearchParams();

	for (const [key, value] of Object.entries(params)) {
		if (value === undefined || value === null || value === '') continue;
		if (Array.isArray(value)) {
			if (value.length > 0) query.set(key, value.join(','));
			continue;
		}
		query.set(key, String(value));
	}

	const text = query.toString();
	return text ? `?${text}` : '';
};

/**
 * Список открытых заказов.
 * @param {Object} params budgetMin, budgetMax, tools (массив), search, page, limit
 * @param {Object} options { signal?: AbortSignal }
 * @returns {{ success: boolean, data: { items, total, page, limit, pages } }}
 */
export const getOrders = (params, { signal } = {}) =>
	authRequest(`${BASE}${buildQuery(params)}`, { signal });

export const getOrder = (id, { signal } = {}) =>
	authRequest(`${BASE}/${encodeURIComponent(id)}`, { signal });

export const createOrder = (data) => authRequest(BASE, { method: 'POST', body: data });

export const updateOrder = (id, data) =>
	authRequest(`${BASE}/${encodeURIComponent(id)}`, { method: 'PATCH', body: data });

export const cancelOrder = (id) =>
	authRequest(`${BASE}/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
export const addFavorite = (id) =>
	authRequest(`${BASE}/${encodeURIComponent(id)}/favorite`, { method: 'PUT' });

export const removeFavorite = (id) =>
	authRequest(`${BASE}/${encodeURIComponent(id)}/favorite`, { method: 'DELETE' });

export const getFavoriteOrders = (params, { signal } = {}) =>
	authRequest(`${BASE}/favorites${buildQuery(params)}`, { signal });
