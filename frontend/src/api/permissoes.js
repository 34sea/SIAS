import api from './axios';

export const permissoesApi = {
    list: (params) => api.get('/permissoes', { params }),
    get: (id) => api.get(`/permissoes/${id}`),
    create: (data) => api.post('/permissoes', data),
    update: (id, data) => api.put(`/permissoes/${id}`, data),
    remove: (id) => api.delete(`/permissoes/${id}`),
};
