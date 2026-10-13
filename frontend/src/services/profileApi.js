import { authRequest } from './authRequest';

export const getMyProfile = () => authRequest('/profile/me');

export const updateMyProfile = (body) => authRequest('/profile/me', { method: 'PUT', body });
