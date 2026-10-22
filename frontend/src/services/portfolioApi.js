import { authRequest } from './authRequest';

const BASE = '/portfolio';

// Текстовые поля добавляем раньше файла, и только те, что переданы
const toFormData = ({ title, projectUrl, image }) => {
	const formData = new FormData();
	if (title !== undefined) formData.append('title', title);
	if (projectUrl !== undefined) formData.append('projectUrl', projectUrl);
	if (image) formData.append('image', image);
	return formData;
};

export const getMyPortfolio = ({ signal } = {}) => authRequest(`${BASE}/me`, { signal });

export const createPortfolioItem = (data) =>
	authRequest(BASE, { method: 'POST', body: toFormData(data) });

export const updatePortfolioItem = (id, data) =>
	authRequest(`${BASE}/${encodeURIComponent(id)}`, { method: 'PATCH', body: toFormData(data) });

export const deletePortfolioItem = (id) =>
	authRequest(`${BASE}/${encodeURIComponent(id)}`, { method: 'DELETE' });
