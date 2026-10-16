import { cursosApi } from '@/api/cursos';

export const cursoService = {
    async listar(params = {}) {
        const { data } = await cursosApi.list(params);
        return data;
    },
    async obter(id) {
        const { data } = await cursosApi.get(id);
        return data;
    },
    async criar(data) {
        const { data: resposta } = await cursosApi.create(data);
        return resposta;
    },
    async actualizar(id, data) {
        const { data: resposta } = await cursosApi.update(id, data);
        return resposta;
    },
    async eliminar(id) {
        const { data } = await cursosApi.remove(id);
        return data;
    },
};
