import api from './axios';

export const analisesApi = {
    list: (params) => api.get('/analises', { params }),
    get: (id) => api.get(`/analises/${id}`),
    create: (data) => api.post('/analises', data),
    reanalisar: (id) => api.post(`/analises/${id}/reanalisar`),
};
