import { orientacoesApi } from '@/api/orientacoes';

export const orientacaoService = {
    async listar(params = {}) {
        const { data } = await orientacoesApi.list(params);
        return data;
    },
    async obter(id) {
        const { data } = await orientacoesApi.get(id);
        return data;
    },
    async criar(data) {
        const { data: resposta } = await orientacoesApi.create(data);
        return resposta;
    },
    async actualizar(id, data) {
        const { data: resposta } = await orientacoesApi.update(id, data);
        return resposta;
    },
    async eliminar(id) {
        const { data } = await orientacoesApi.remove(id);
        return data;
    },
};
