import api from './axios';

export const orientacoesApi = {
    list: (params) => api.get('/orientacoes', { params }),
    get: (id) => api.get(`/orientacoes/${id}`),
    create: (data) => api.post('/orientacoes', data),
    update: (id, data) => api.put(`/orientacoes/${id}`, data),
    remove: (id) => api.delete(`/orientacoes/${id}`),
};
