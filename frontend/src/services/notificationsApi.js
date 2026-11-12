import { authRequest } from './authRequest';

const BASE = '/notifications';

export const getNotifications = ({ limit = 10, signal } = {}) =>
	authRequest(`${BASE}?limit=${limit}`, { signal });

export const markNotificationRead = (id) =>
	authRequest(`${BASE}/${encodeURIComponent(id)}/read`, { method: 'POST' });

export const markAllNotificationsRead = () => authRequest(`${BASE}/read-all`, { method: 'POST' });
