import { request } from './api';

export const registerUser = ({ email, password, role, fullName, consent }) =>
	request('/auth/register', {
		method: 'POST',
		body: { email, password, role, fullName, consent },
	});

export const loginUser = ({ email, password }) =>
	request('/auth/login', { method: 'POST', body: { email, password } });

export const refreshTokens = (refreshToken) =>
	request('/auth/refresh', { method: 'POST', body: { refreshToken } });
