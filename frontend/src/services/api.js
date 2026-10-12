const BASE_URL = '/api/v1';

export class ApiError extends Error {
	constructor(message, status, errors = []) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.errors = errors;
	}
}

export async function request(path, { method = 'GET', body, headers = {} } = {}) {
	let response;
	try {
		response = await fetch(`${BASE_URL}${path}`, {
			method,
			headers: { 'Content-Type': 'application/json', ...headers },
			body: body ? JSON.stringify(body) : undefined,
		});
	} catch {
		throw new ApiError('Нет связи с сервером. Попробуйте позже.', 0);
	}

	const data = await response.json().catch(() => null);

	if (!response.ok) {
		throw new ApiError(data?.message || 'Что-то пошло не так', response.status, data?.errors || []);
	}
	return data;
}

// { email: 'Некорректный email', ... } — удобно для setError из react-hook-form
export const toFieldErrors = (error) =>
	Object.fromEntries((error.errors || []).map((e) => [e.field, e.message]));
