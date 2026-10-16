import { ref } from 'vue';
import { cursoService } from '@/services/cursoService';

export function useCursos() {
    const items = ref([]);
    const loading = ref(false);
    const error = ref(null);

    async function listar(params = {}) {
        loading.value = true;
        error.value = null;
        try {
            const resposta = await cursoService.listar(params);
            items.value = resposta.data || resposta;
            return { success: true, data: items.value };
        } catch (err) {
            error.value = err.message || 'Erro ao listar cursos.';
            return { success: false, error: error.value };
        } finally {
            loading.value = false;
        }
    }

    async function criar(data) {
        try {
            const resposta = await cursoService.criar(data);
            await listar();
            return { success: true, data: resposta };
        } catch (err) {
            error.value = err.message || 'Erro ao criar curso.';
            return { success: false, error: error.value };
        }
    }

    async function actualizar(id, data) {
        try {
            const resposta = await cursoService.actualizar(id, data);
            await listar();
            return { success: true, data: resposta };
        } catch (err) {
            error.value = err.message || 'Erro ao actualizar curso.';
            return { success: false, error: error.value };
        }
    }

    async function eliminar(id) {
        try {
            await cursoService.eliminar(id);
            await listar();
            return { success: true };
        } catch (err) {
            error.value = err.message || 'Erro ao eliminar curso.';
            return { success: false, error: error.value };
        }
    }

    return { items, loading, error, listar, criar, actualizar, eliminar };
}
