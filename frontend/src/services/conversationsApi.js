import { authRequest } from './authRequest';

const BASE = '/conversations';
const enc = encodeURIComponent;

export const getConversations = ({ search, signal } = {}) =>
	authRequest(search ? `${BASE}?search=${enc(search)}` : BASE, { signal });

export const getConversation = (id, { signal } = {}) =>
	authRequest(`${BASE}/${enc(id)}`, { signal });

export const getConversationByOrder = (orderId, { signal } = {}) =>
	authRequest(`${BASE}/by-order/${enc(orderId)}`, { signal });

// «Удалить чат»: убирает его только из моего списка
export const hideConversation = (id) => authRequest(`${BASE}/${enc(id)}`, { method: 'DELETE' });

export const getMessages = (id, { limit = 50, signal } = {}) =>
	authRequest(`${BASE}/${enc(id)}/messages?limit=${limit}`, { signal });

export const sendMessage = (id, text) =>
	authRequest(`${BASE}/${enc(id)}/messages`, { method: 'POST', body: { text } });

export const markConversationRead = (id) =>
	authRequest(`${BASE}/${enc(id)}/read`, { method: 'POST' });

export const getUnreadCount = ({ signal } = {}) => authRequest(`${BASE}/unread-count`, { signal });
