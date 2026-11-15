import { authRequest } from './authRequest';

const BASE = '/conversations';

export const getConversations = ({ signal } = {}) => authRequest(BASE, { signal });

export const getMessages = (id, { limit = 50, signal } = {}) =>
	authRequest(`${BASE}/${encodeURIComponent(id)}/messages?limit=${limit}`, { signal });

export const sendMessage = (id, text) =>
	authRequest(`${BASE}/${encodeURIComponent(id)}/messages`, { method: 'POST', body: { text } });

export const markConversationRead = (id) =>
	authRequest(`${BASE}/${encodeURIComponent(id)}/read`, { method: 'POST' });

export const getUnreadCount = ({ signal } = {}) => authRequest(`${BASE}/unread-count`, { signal });
