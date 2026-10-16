<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useAnalises } from '@/composables/useAnalises';
import { useAuth } from '@/composables/useAuth';
import { useMonografias } from '@/composables/useMonografias';
import { useToast } from 'primevue/usetoast';

const { listar, obter, executar, reanalisar, items, loading, error } = useAnalises();
const { isAuthenticated, role } = useAuth();
const { listar: listarMonografias, items: monografiasItems } = useMonografias();
const toast = useToast();

const form = reactive({
    monografia_versao_id: '',
    algoritmo: 'TF-IDF + Similaridade de Cosseno',
    texto_override: '',
});
const showForm = ref(false);
const search = ref('');
const estadoFiltro = ref('');

const analisesFiltradas = computed(() =>
    items.value.filter((a) => {
        const matchBusca =
            !search.value ||
            (a.monografia_titulo && a.monografia_titulo.toLowerCase().includes(search.value.toLowerCase())) ||
            (a.estudante_nome && a.estudante_nome.toLowerCase().includes(search.value.toLowerCase()));
        const matchEstado = !estadoFiltro.value || a.estado === estadoFiltro.value;
        return matchBusca && matchEstado;
    })
);

onMounted(async () => {
    await listar({ search: '', estado: '' });
    await listarMonografias();
});

async function abrirExecutar() {
    form.monografia_versao_id = '';
    form.algoritmo = 'TF-IDF + Similaridade de Cosseno';
    form.texto_override = '';
    showForm.value = true;
}

async function handleExecutar() {
    if (!form.monografia_versao_id) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione uma versão de monografia.' });
        return;
    }
    const resposta = await executar({
        monografia_versao_id: Number(form.monografia_versao_id),
        algoritmo: form.algoritmo,
        texto_override: form.texto_override || undefined,
    });
    if (resposta.success) {
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Análise executada com sucesso.' });
        showForm.value = false;
        await listar({ search: '', estado: '' });
    } else {
        toast.add({ severity: 'error', summary: 'Erro', detail: resposta.error });
    }
}

async function handleReanalisar(id) {
    if (!window.confirm('Deseja solicitar uma nova análise deste registo?')) return;
    const resposta = await reanalisar(id);
    if (resposta.success) {
        toast.add({ severity: 'info', summary: 'Reanálise', detail: 'Análise redefinida para aguardando.' });
        await listar({ search: '', estado: '' });
    } else {
        toast.add({ severity: 'error', summary: 'Erro', detail: resposta.error });
    }
}

const podeExecutar = computed(() => role.value === 'ADMIN' || role.value === 'DOCENTE');
const podeVer = computed(() => role.value === 'ADMIN' || role.value === 'DOCENTE' || role.value === 'ESTUDANTE');

</script>

<template>
    <div class="analises-page">
        <Toast />
        <div class="page-header">
            <h1 class="text-2xl font-bold text-sias-800">Análises de Similaridade</h1>
            <p class="text-sias-600">Gerir e acompanhar o processo de análise das monografias.</p>
        </div>

        <div class="toolbar">
            <div class="search-area">
                <InputText v-model="search.value" placeholder="Pesquisar por título ou estudante" />
                <Dropdown v-model="estadoFiltro.value" :options="[
                    { label: 'Todos', value: '' },
                    { label: 'Aguardando', value: 'AGUARDANDO' },
                    { label: 'Processando', value: 'PROCESSANDO' },
                    { label: 'Concluída', value: 'CONCLUIDA' },
                    { label: 'Erro', value: 'ERRO' },
                ]" placeholder="Estado" />
            </div>
            <div class="actions">
                <Button v-if="podeExecutar" label="Executar Análise" icon="pi pi-play" outlined @click="abrirExecutar" />
            </div>
        </div>

        <Card class="mt-4">
            <DataTable :value="analisesFiltradas" :paginator="true" :rows="10" dataKey="id" :loading="loading">
                <template #header>
                    <span>Análises ({{ items.value.length }})</span>
                </template>
                <Column field="monografia_titulo" header="Monografia" sortable />
                <Column field="estudante_nome" header="Estudante" sortable />
                <Column field="numero_versao" header="Versão" sortable />
                <Column field="algoritmo" header="Algoritmo" />
                <Column field="estado" header="Estado" sortable>
                    <template #body="slotProps">
                        <span class="estado-badge" :class="`estado-${slotProps.data.estado}`">
                            {{ slotProps.data.estado }}
                        </span>
                    </template>
                </Column>
                <Column field="similaridade_geral" header="Similaridade (%)" sortable />
                <Column field="classificacao" header="Classificação" />
                <Column field="data_conclusao" header="Concluída em" />
                <Column field="acoes" header="Ações" style="width: 220px; text-align: center">
                    <template #body="slotProps">
                        <div class="flex justify-content-center gap-2">
                            <Button icon="pi pi-eye" outlined rounded @click="obter(slotProps.data.id)" />
                            <Button v-if="podeExecutar && slotProps.data.estado === 'ERRO'" icon="pi pi-redo" outlined @click="handleReanalisar(slotProps.data.id)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </Card>

        <!-- Dialog: Executar análise -->
        <Dialog v-model:visible="showForm" header="Executar Nova Análise" :modal="true" style="width: 550px">
            <div class="flex flex-col gap-3">
                <Dropdown v-model="form.monografia_versao_id" label="Versão da Monografia" :options="monografiasItems.map(m => ({ label: m.titulo, value: m.id }))" placeholder="Selecionar versão" />
                <InputText v-model="form.algoritmo" label="Algoritmo" placeholder="TF-IDF + Similaridade de Cosseno" />
                <Textarea v-model="form.texto_override" label="Texto para análise (opcional)" :rows="3" placeholder="Deixe vazio para usar o texto extraído do ficheiro" />
            </div>
            <template #footer>
                <Button label="Cancelar" outlined @click="showForm = false" />
                <Button label="Executar" icon="pi pi-play" @click="handleExecutar" />
            </template>
        </Dialog>

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
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 1rem;
}
.search-area {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex: 1;
    min-width: 260px;
}
.actions {
    display: flex;
    gap: 0.5rem;
}
.estado-badge {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
}
.estado-aguardando { background: #fff3cd; color: #856404; }
.estado-processando { background: #cce5ff; color: #004085; }
.estado-concluida { background: #d4edda; color: #155724; }
.estado-erro { background: #f8d7da; color: #721c24; }
</style>
