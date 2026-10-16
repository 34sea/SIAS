import api from './axios';

export const estudantesApi = {
    list: (params) => api.get('/estudantes', { params }),
    get: (id) => api.get(`/estudantes/${id}`),
    create: (data) => api.post('/estudantes', data),
    update: (id, data) => api.put(`/estudantes/${id}`, data),
    remove: (id) => api.delete(`/estudantes/${id}`),
};
