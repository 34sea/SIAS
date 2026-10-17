<script setup>
import { ref, reactive, onMounted } from 'vue';
import { orientacaoService } from '@/services/orientacaoService';
import { estudanteService } from '@/services/estudanteService';
import { docenteService } from '@/services/docenteService';
import { useToast } from 'primevue/usetoast';

const { listar, criar, actualizar, eliminar } = orientacaoService();
const { listar: listarEstudantes } = estudanteService;
const { listar: listarDocentes } = docenteService;
const toast = useToast();

const orientacoes = ref([]);
const estudantes = ref([]);
const docentes = ref([]);
const loading = ref(false);
const error = ref(null);
const form = reactive({ id: null, estudante_id: '', docente_id: '', data_inicio: null, data_fim: null, estado: 'ATIVA', observacoes: '' });
const showForm = ref(false);
const modoEdicao = ref(false);

onMounted(async () => {
    loading.value = true;
    try {
        const [respostaOrientacoes, respostaEstudantes, respostaDocentes] = await Promise.all([
            listar({}), listarEstudantes({}), listarDocentes({})
        ]);
        orientacoes.value = respostaOrientacoes.data || respostaOrientacoes;
        estudantes.value = respostaEstudantes.data || respostaEstudantes;
        docentes.value = respostaDocentes.data || respostaDocentes;
    } catch (err) {
        error.value = err.message || 'Erro ao listar orientações.';
        toast.add({ severity: 'error', summary: 'Erro', detail: error.value });
    } finally {
        loading.value = false;
    }
});

function abrirNovo() {
    Object.assign(form, { id: null, estudante_id: '', docente_id: '', data_inicio: null, data_fim: null, estado: 'ATIVA', observacoes: '' });
    modoEdicao.value = false;
    showForm.value = true;
}

function editar(item) {
    Object.assign(form, { id: item.id, estudante_id: item.estudante_id, docente_id: item.docente_id, data_inicio: item.data_inicio ? new Date(item.data_inicio) : null, data_fim: item.data_fim ? new Date(item.data_fim) : null, estado: item.estado, observacoes: item.observacoes || '' });
    modoEdicao.value = true;
    showForm.value = true;
}

async function salvar() {
    if (!form.estudante_id || !form.docente_id) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Estudante e docente são obrigatórios.' });
        return;
    }
    try {
        const resposta = modoEdicao.value
            ? await actualizar(form.id, { data_inicio: form.data_inicio, data_fim: form.data_fim, estado: form.estado, observacoes: form.observacoes })
            : await criar({ estudante_id: form.estudante_id, docente_id: form.docente_id, data_inicio: form.data_inicio, data_fim: form.data_fim, estado: form.estado, observacoes: form.observacoes });
        if (resposta.success) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: modoEdicao.value ? 'Orientação actualizada.' : 'Orientação registada.' });
            showForm.value = false;
            await listar({});
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: resposta.error });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Erro ao guardar orientação.' });
    }
}

async function remover(id) {
    if (!window.confirm('Eliminar esta orientação?')) return;
    try {
        const resposta = await eliminar(id);
        if (resposta.success) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Orientação eliminada.' });
            await listar({});
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: resposta.error });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Erro ao eliminar orientação.' });
    }
}

</script>

<template>
    <div class="crud-page">
        <Toast />
        <div class="page-header">
            <h1 class="text-2xl font-bold">Gestão de Orientações</h1>
            <p class="text-sias-text-secondary">Associe estudantes aos respectivos orientadores.</p>
        </div>

        <div class="toolbar">
            <Button label="Nova Orientação" icon="pi pi-plus" outlined @click="abrirNovo" />
        </div>

        <Card class="mt-4">
            <DataTable :value="orientacoes" :paginator="true" :rows="10" dataKey="id" :loading="loading" emptyMessage="Nenhuma orientação encontrada.">
                <template #header>
                    <span>Orientações ({{ orientacoes.value.length }})</span>
                </template>
                <Column field="estudante_nome" header="Estudante" sortable />
                <Column field="docente_nome" header="Orientador" sortable />
                <Column field="data_inicio" header="Início" />
                <Column field="data_fim" header="Fim" />
                <Column field="estado" header="Estado">
                    <template #body="slotProps">
                        <span :class="`badge-${slotProps.data.estado.toLowerCase()}`">
                            {{ slotProps.data.estado }}
                        </span>
                    </template>
                </Column>
                <Column field="acoes" header="Ações" style="width: 180px; text-align: center">
                    <template #body="slotProps">
                        <div class="flex justify-content-center gap-2">
                            <Button icon="pi pi-pencil" outlined rounded @click="editar(slotProps.data)" />
                            <Button icon="pi pi-trash" outlined severity="danger" rounded @click="remover(slotProps.data.id)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </Card>

        <Dialog v-model:visible="showForm" :header="modoEdicao ? 'Editar Orientação' : 'Nova Orientação'" :modal="true" style="width: 550px">
            <div class="flex flex-col gap-3">
                <Dropdown v-model="form.estudante_id" label="Estudante" :options="estudantes.map(e => ({ label: e.nome_completo, value: e.id }))" placeholder="Selecionar estudante" />
                <Dropdown v-model="form.docente_id" label="Docente / Orientador" :options="docentes.map(d => ({ label: d.nome_completo, value: d.id }))" placeholder="Selecionar docente" />
                <Calendar v-model="form.data_inicio" label="Data de Início" />
                <Calendar v-model="form.data_fim" label="Data de Fim (opcional)" />
                <Dropdown v-model="form.estado" label="Estado" :options="[
                    { label: 'Activa', value: 'ATIVA' },
                    { label: 'Concluída', value: 'CONCLUIDA' },
                    { label: 'Cancelada', value: 'CANCELADA' },
                ]" />
                <InputText v-model="form.observacoes" label="Observações" />
            </div>
            <template #footer>
                <Button label="Cancelar" outlined @click="showForm = false" />
                <Button label="Guardar" icon="pi pi-save" @click="salvar" />
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
    margin-bottom: 1rem;
    display: flex;
    gap: 0.5rem;
    align-items: center;
}
.badge-ativa {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    background: var(--sias-dusk-blue);
    color: var(--sias-text-primary);
    font-size: 0.8rem;
    font-weight: 600;
}
.badge-concluida {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    background: var(--sias-cloud-blue);
    color: var(--sias-text-primary);
    font-size: 0.8rem;
    font-weight: 600;
}
.badge-cancelada {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    background: var(--sias-blue-slate);
    color: var(--sias-text-primary);
    font-size: 0.8rem;
    font-weight: 600;
}
.crud-page {
    color: var(--sias-text-primary);
}
</style>
