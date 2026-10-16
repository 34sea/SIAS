import { ref } from 'vue';
import { notificacaoService } from '@/services/notificacaoService';

export function useNotificacoes(utilizadorId) {
    const items = ref([]);
    const loading = ref(false);
    const error = ref(null);

    async function listar(params = {}) {
        if (utilizadorId) params.utilizador_id = utilizadorId;
        loading.value = true;
        error.value = null;
        try {
            const resposta = await notificacaoService.listar(params);
            items.value = resposta.data || resposta;
            return { success: true, data: items.value };
        } catch (err) {
            error.value = err.message || 'Erro ao listar notificações.';
            return { success: false, error: error.value };
        } finally {
            loading.value = false;
        }
    }

    async function marcarLida(id) {
        try {
            await notificacaoService.marcarLida(id);
            await listar();
            return { success: true };
        } catch (err) {
            error.value = err.message || 'Erro ao marcar como lida.';
            return { success: false, error: error.value };
        }
    }

    return { items, loading, error, listar, marcarLida };
}
