import { relatoriosApi } from '@/api/relatorios';

export const relatorioService = {
    async listar(params = {}) {
        const { data } = await relatoriosApi.list(params);
        return data;
    },
    async obter(id) {
        const { data } = await relatoriosApi.get(id);
        return data;
    },
    async gerar(data) {
        const { data: resposta } = await relatoriosApi.create(data);
        return resposta;
    },
    async atualizarDisponibilidade(id, data) {
        const { data: resposta } = await relatoriosApi.atualizarDisponibilidade(id, data);
        return resposta;
    },
    async download(id) {
        const { data } = await relatoriosApi.download(id);
        return data;
    },
};
