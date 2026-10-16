import { analisesApi } from '@/api/analises';

export const analiseService = {
    async listar(params = {}) {
        const { data } = await analisesApi.list(params);
        return data;
    },
    async obter(id) {
        const { data } = await analisesApi.get(id);
        return data;
    },
    async executar(data) {
        const { data: resposta } = await analisesApi.create(data);
        return resposta;
    },
    async reanalisar(id) {
        const { data } = await analisesApi.reanalisar(id);
        return data;
    },
};
