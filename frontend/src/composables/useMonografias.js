import { ref, computed } from 'vue';
import { monografiaService } from '@/services/monografiaService';

export function useMonografias() {
    const items = ref([]);
    const total = ref(0);
    const loading = ref(false);
    const error = ref(null);
    const item = ref(null);
    const versoes = ref([]);

    async function listar(params = {}) {
        loading.value = true;
        error.value = null;
        try {
            const resposta = await monografiaService.listar(params);
            items.value = resposta.data || resposta;
            total.value = resposta.total || items.value.length;
            return { success: true, data: items.value };
        } catch (err) {
            error.value = err.message || 'Erro ao listar monografias.';
            return { success: false, error: error.value };
        } finally {
            loading.value = false;
        }
    }

    async function obter(id) {
        loading.value = true;
        error.value = null;
        try {
            const resposta = await monografiaService.obter(id);
            item.value = resposta.data || resposta;
            return { success: true, data: item.value };
        } catch (err) {
            error.value = err.message || 'Erro ao obter monografia.';
            return { success: false, error: error.value };
        } finally {
            loading.value = false;
        }
    }

    async function submeter(formData) {
        loading.value = true;
        error.value = null;
        try {
            const resposta = await monografiaService.submeter(formData);
            return { success: true, data: resposta };
        } catch (err) {
            error.value = err.message || 'Erro ao submeter monografia.';
            return { success: false, error: error.value };
        } finally {
            loading.value = false;
        }
    }

    async function carregarVersoes(monografiaId) {
        try {
            const resposta = await monografiaService.listarVersoes(monografiaId);
            versoes.value = resposta.data || resposta;
            return versoes.value;
        } catch (err) {
            error.value = err.message || 'Erro ao carregar versões.';
            return [];
        }
    }

    async function submeterVersao(monografiaId, formData) {
        loading.value = true;
        error.value = null;
        try {
            const resposta = await monografiaService.submeterVersao(monografiaId, formData);
            await carregarVersoes(monografiaId);
            return { success: true, data: resposta };
        } catch (err) {
            error.value = err.message || 'Erro ao submeter versão.';
            return { success: false, error: error.value };
        } finally {
            loading.value = false;
        }
    }

    async function arquivar(id) {
        try {
            await monografiaService.arquivar(id);
            return { success: true };
        } catch (err) {
            error.value = err.message || 'Erro ao arquivar.';
            return { success: false, error: error.value };
        }
    }

    return {
        items,
        total,
        loading,
        error,
        item,
        versoes,
        listar,
        obter,
        submeter,
        carregarVersoes,
        submeterVersao,
        arquivar,
    };
}
