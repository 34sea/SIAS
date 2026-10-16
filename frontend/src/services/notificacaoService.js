import { notificacoesApi } from '@/api/notificacoes';

export const notificacaoService = {
    async listar(params = {}) {
        const { data } = await notificacoesApi.list(params);
        return data;
    },
    async criar(data) {
        const { data: resposta } = await notificacoesApi.create(data);
        return resposta;
    },
    async marcarLida(id) {
        const { data } = await notificacoesApi.marcarLida(id);
        return data;
    },
    async eliminar(id) {
        const { data } = await notificacoesApi.remove(id);
        return data;
    },
};
