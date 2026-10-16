import { monografiasApi } from '@/api/monografias';

export const monografiaService = {
    async listar(params = {}) {
        const { data } = await monografiasApi.list(params);
        return data;
    },
    async obter(id) {
        const { data } = await monografiasApi.get(id);
        return data;
    },
    async submeter(formData) {
        const config = {
            headers: { 'Content-Type': 'multipart/form-data' },
        };
        const { data } = await monografiasApi.create(formData, config);
        return data;
    },
    async atualizar(id, data) {
        const { data: resposta } = await monografiasApi.update(id, data);
        return resposta;
    },
    async listarVersoes(monografiaId) {
        const { data } = await monografiasApi.versaoList(monografiaId);
        return data;
    },
    async submeterVersao(monografiaId, formData) {
        const config = {
            headers: { 'Content-Type': 'multipart/form-data' },
        };
        const { data } = await monografiasApi.versaoCreate(monografiaId, formData, config);
        return data;
    },
    async arquivar(id) {
        const { data } = await monografiasApi.remove(id);
        return data;
    },
};
