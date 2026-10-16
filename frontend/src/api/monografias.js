import api from './axios';

export const monografiasApi = {
    list: (params) => api.get('/moonograph', { params }),
    get: (id) => api.get(`/moonograph/${id}`),
    create: (data, config) => api.post('/moonograph', data, config),
    update: (id, data) => api.put(`/moonograph/${id}`, data),
    versaoList: (monografiaId) => api.get(`/moonograph/${monografiaId}/versoes`),
    versaoCreate: (monografiaId, data, config) =>
        api.post(`/moonograph/${monografiaId}/versoes`, data, config),
    remove: (id) => api.delete(`/moonograph/${id}`),
};
