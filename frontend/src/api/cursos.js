import api from './axios';

export const cursosApi = {
    list: (params) => api.get('/cursos', { params }),
    get: (id) => api.get(`/cursos/${id}`),
    create: (data) => api.post('/cursos', data),
    update: (id, data) => api.put(`/cursos/${id}`, data),
    remove: (id) => api.delete(`/cursos/${id}`),
};
