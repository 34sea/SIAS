import api from './axios';

export const docentesApi = {
    list: (params) => api.get('/docentes', { params }),
    get: (id) => api.get(`/docentes/${id}`),
    create: (data) => api.post('/docentes', data),
    update: (id, data) => api.put(`/docentes/${id}`, data),
    remove: (id) => api.delete(`/docentes/${id}`),
};
