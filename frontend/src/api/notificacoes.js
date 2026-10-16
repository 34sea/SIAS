import api from './axios';

export const notificacoesApi = {
    list: (params) => api.get('/notificacoes', { params }),
    create: (data) => api.post('/notificacoes', data),
    marcarLida: (id) => api.patch(`/notificacoes/${id}/lida`),
    remove: (id) => api.delete(`/notificacoes/${id}`),
};
