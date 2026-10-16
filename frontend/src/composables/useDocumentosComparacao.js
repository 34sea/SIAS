import { ref } from 'vue';
import { documentoComparacaoService } from '@/services/documentoComparacaoService';

export function useDocumentosComparacao() {
    const items = ref([]);
    const loading = ref(false);
    const error = ref(null);

    async function listar(params = {}) {
        loading.value = true;
        error.value = null;
        try {
            const resposta = await documentoComparacaoService.listar(params);
            items.value = resposta.data || resposta;
            return { success: true, data: items.value };
        } catch (err) {
            error.value = err.message || 'Erro ao listar documentos de comparação.';
            return { success: false, error: error.value };
        } finally {
            loading.value = false;
        }
    }

    async function criar(data) {
        try {
            const resposta = await documentoComparacaoService.criar(data);
            await listar();
            return { success: true, data: resposta };
        } catch (err) {
            error.value = err.message || 'Erro ao criar documento.';
            return { success: false, error: error.value };
        }
    }

    async function actualizar(id, data) {
        try {
            const resposta = await documentoComparacaoService.actualizar(id, data);
            await listar();
            return { success: true, data: resposta };
        } catch (err) {
            error.value = err.message || 'Erro ao actualizar documento.';
            return { success: false, error: error.value };
        }
    }

    async function eliminar(id) {
        try {
            await documentoComparacaoService.eliminar(id);
            await listar();
            return { success: true };
        } catch (err) {
            error.value = err.message || 'Erro ao eliminar documento.';
            return { success: false, error: error.value };
        }
    }

    return { items, loading, error, listar, criar, actualizar, eliminar };
}
