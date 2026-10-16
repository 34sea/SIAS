import { ref } from 'vue';
import { analiseService } from '@/services/analiseService';

export function useAnalises() {
    const items = ref([]);
    const loading = ref(false);
    const error = ref(null);

    async function listar(params = {}) {
        loading.value = true;
        error.value = null;
        try {
            const resposta = await analiseService.listar(params);
            items.value = resposta.data || resposta;
            return { success: true, data: items.value };
        } catch (err) {
            error.value = err.message || 'Erro ao listar análises.';
            return { success: false, error: error.value };
        } finally {
            loading.value = false;
        }
    }

    async function obter(id) {
        loading.value = true;
        error.value = null;
        try {
            const resposta = await analiseService.obter(id);
            return { success: true, data: resposta.data || resposta };
        } catch (err) {
            error.value = err.message || 'Erro ao obter análise.';
            return { success: false, error: error.value };
        } finally {
            loading.value = false;
        }
    }

    async function executar(data) {
        loading.value = true;
        error.value = null;
        try {
            const resposta = await analiseService.executar(data);
            return { success: true, data: resposta };
        } catch (err) {
            error.value = err.message || 'Erro ao executar análise.';
            return { success: false, error: error.value };
        } finally {
            loading.value = false;
        }
    }

    async function reanalisar(id) {
        try {
            const resposta = await analiseService.reanalisar(id);
            return { success: true, data: resposta };
        } catch (err) {
            error.value = err.message || 'Erro ao reanalisar.';
            return { success: false, error: error.value };
        }
    }

    return { items, loading, error, listar, obter, executar, reanalisar };
}
