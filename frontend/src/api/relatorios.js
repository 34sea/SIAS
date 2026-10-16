import api from './axios';

export const relatoriosApi = {
    list: (params) => api.get('/relatorios', { params }),
    get: (id) => api.get(`/relatorios/${id}`),
    create: (data) => api.post('/relatorios', data),
    atualizarDisponibilidade: (id, data) => api.patch(`/relatorios/${id}/disponibilidade`, data),
    download: (id) => api.get(`/relatorios/${id}/download`, { responseType: 'blob' }),
};
