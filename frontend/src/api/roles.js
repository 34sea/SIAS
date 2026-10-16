import api from './axios';

export const rolesApi = {
    list: () => api.get('/roles'),
    get: (id) => api.get(`/roles/${id}`),
    create: (data) => api.post('/roles', data),
    update: (id, data) => api.put(`/roles/${id}`, data),
    remove: (id) => api.delete(`/roles/${id}`),
    getPermissions: (id) => api.get(`/roles/${id}/permissoes`),
    assignPermissions: (id, permissao_ids) => api.put(`/roles/${id}/permissoes`, { permissao_ids }),
    addPermission: (id, permissao_id) => api.post(`/roles/${id}/permissoes`, { permissao_id }),
    removePermission: (id, permissaoId) => api.delete(`/roles/${id}/permissoes/${permissaoId}`),
};
