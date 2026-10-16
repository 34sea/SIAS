import { estudantesApi } from '@/api/estudantes';

export const estudanteService = {
    async listar(params = {}) {
        const { data } = await estudantesApi.list(params);
        return data;
    },
    async obter(id) {
        const { data } = await estudantesApi.get(id);
        return data;
    },
    async criar(data) {
        const { data: resposta } = await estudantesApi.create(data);
        return resposta;
    },
    async actualizar(id, data) {
        const { data: resposta } = await estudantesApi.update(id, data);
        return resposta;
    },
    async eliminar(id) {
        const { data } = await estudantesApi.remove(id);
        return data;
    },
};
