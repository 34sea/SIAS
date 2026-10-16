import api from './axios';

export const configuracoesApi = {
    list: () => api.get('/configuracoes-similaridade'),
    get: (id) => api.get(`/configuracoes-similaridade/${id}`),
    create: (data) => api.post('/configuracoes-similaridade', data),
    update: (id, data) => api.put(`/configuracoes-similaridade/${id}`, data),
    remove: (id) => api.delete(`/configuracoes-similaridade/${id}`),
    listClassificacoes: () => api.get('/configuracoes-similaridade/classificacoes'),
    createClassificacao: (data) => api.post('/configuracoes-similaridade/classificacoes', data),
    updateClassificacao: (id, data) => api.put(`/configuracoes-similaridade/classificacoes/${id}`, data),
    removeClassificacao: (id) => api.delete(`/configuracoes-similaridade/classificacoes/${id}`),
};
