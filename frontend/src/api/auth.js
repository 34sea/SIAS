import api from './axios';

export const authApi = {
    login: (credentials) => api.post('/auth/login', credentials),
    me: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout'),
};
