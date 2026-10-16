import api from './axios';

export const documentosComparacaoApi = {
    list: (params) => api.get('/documentos-comparacao', { params }),
    get: (id) => api.get(`/documentos-comparacao/${id}`),
    create: (data, config) => api.post('/documentos-comparacao', data, config || {}),
    update: (id, data, config) => api.put(`/documentos-comparacao/${id}`, data, config || {}),
    remove: (id) => api.delete(`/documentos-comparacao/${id}`),
};
