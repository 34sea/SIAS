<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { relatorioService } from '@/services/relatorioService';
import { useToast } from 'primevue/usetoast';

const { role, user } = useAuth();
const toast = useToast();

const relatorios = ref([]);
const loading = ref(false);
const error = ref(null);
const search = ref('');

async function listar() {
    loading.value = true;
    error.value = null;
    try {
        const params = {};
        if (role.value === 'ESTUDANTE') params.disponivel_estudante = '1';
        if (role.value === 'DOCENTE') params.disponivel_orientador = '1';
        const resposta = await relatorioService.listar(params);
        relatorios.value = resposta.data || resposta;
    } catch (err) {
        error.value = err.message || 'Erro ao listar relatórios.';
        toast.add({ severity: 'error', summary: 'Erro', detail: error.value });
    } finally {
        loading.value = false;
    }
}

async function baixar(id) {
    try {
        const blob = await relatorioService.download(id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.add({ severity: 'success', summary: 'Download', detail: 'Relatório transferido.' });
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Erro ao baixar relatório.' });
    }
}

const relatoriosFiltrados = computed(() =>
    relatorios.value.filter((r) => !search.value || r.numero_relatorio.toLowerCase().includes(search.value.toLowerCase()))
);

onMounted(listar);

</script>

<template>
    <div class="relatorios-page">
        <Toast />
        <div class="page-header">
            <h1 class="text-2xl font-bold">Relatórios de Similaridade</h1>
            <p class="text-sias-text-secondary">Consulte e exporte os relatórios de análise gerados.</p>
        </div>

        <div class="toolbar">
            <InputText v-model="search.value" placeholder="Pesquisar relatório por número" />
        </div>

        <Card class="mt-4">
            <DataTable :value="relatoriosFiltrados" :paginator="true" :rows="10" dataKey="id" :loading="loading" emptyMessage="Nenhum relatório encontrado.">
                <template #header>
                    <span>Relatórios ({{ relatorios.value.length }})</span>
                </template>
                <Column field="numero_relatorio" header="Nº Relatório" sortable />
                <Column field="monografia_titulo" header="Monografia" sortable />
                <Column field="estudante_nome" header="Estudante" sortable />
                <Column field="percentual_similaridade" header="Similaridade (%)" sortable />
                <Column field="classificacao" header="Classificação" />
                <Column field="data_geracao" header="Gerado em" />
                <Column field="acoes" header="Ações" style="width: 140px; text-align: center">
                    <template #body="slotProps">
                        <Button icon="pi pi-download" outlined rounded @click="baixar(slotProps.data.id)" />
                    </template>
                </Column>
            </DataTable>
        </Card>

        <div v-if="error" class="p-3 text-red-500 bg-red-50 rounded mt-4">Erro: {{ error }}</div>
    </div>
</template>

<style scoped>
.page-header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 1.5rem;
}
.toolbar {
    margin-bottom: 1rem;
}
.crud-page {
    color: var(--sias-text-primary);
}
</style>
