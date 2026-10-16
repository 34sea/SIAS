import { documentosComparacaoApi } from '@/api/documentosComparacao';

export const documentoComparacaoService = {
    async listar(params = {}) {
        const { data } = await documentosComparacaoApi.list(params);
        return data;
    },
    async obter(id) {
        const { data } = await documentosComparacaoApi.get(id);
        return data;
    },
    async criar(data) {
        const { data: resposta } = await documentosComparacaoApi.create(data, {
            headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
        });
        return resposta;
    },
    async actualizar(id, data) {
        const { data: resposta } = await documentosComparacaoApi.update(id, data, {
            headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
        });
        return resposta;
    },
    async eliminar(id) {
        const { data } = await documentosComparacaoApi.remove(id);
        return data;
    },
};
