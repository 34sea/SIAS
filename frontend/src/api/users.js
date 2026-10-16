import api from './axios';

export const usersApi = {
    list: (params) => api.get('/users', { params }),
    get: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data, {
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
    }),
    update: (data, id) => api.put(`/users/${id}`, data, {
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
    }),
    updateStatus: (id, estado) => api.patch(`/users/${id}/status`, { estado }),
    updatePassword: (id, password) => api.patch(`/users/${id}/password`, { nova_password_hash: password }),
    remove: (id) => api.delete(`/users/${id}`),
};
