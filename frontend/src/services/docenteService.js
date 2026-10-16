import { docentesApi } from '@/api/docentes';

export const docenteService = {
    async listar(params = {}) {
        const { data } = await docentesApi.list(params);
        return data;
    },
    async obter(id) {
        const { data } = await docentesApi.get(id);
        return data;
    },
    async criar(data) {
        const { data: resposta } = await docentesApi.create(data);
        return resposta;
    },
    async actualizar(id, data) {
        const { data: resposta } = await docentesApi.update(id, data);
        return resposta;
    },
    async eliminar(id) {
        const { data } = await docentesApi.remove(id);
        return data;
    },
};
