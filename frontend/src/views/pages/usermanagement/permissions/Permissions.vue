<script setup>
import { ref, reactive, onMounted } from 'vue';
import { permissoesApi } from '@/api/permissoes';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const permissoes = ref([]);
const loading = ref(false);
const error = ref(null);
const search = ref('');

const form = reactive({ id: null, nome: '', descricao: '' });
const showForm = ref(false);
const modoEdicao = ref(false);

onMounted(carregar);

async function carregar() {
    loading.value = true;
    try {
        const resposta = await permissoesApi.list({ search: search.value });
        permissoes.value = resposta.data || resposta;
    } catch (err) {
        error.value = err.message || 'Erro ao listar permissões.';
        toast.add({ severity: 'error', summary: 'Erro', detail: error.value });
    } finally {
        loading.value = false;
    }
}

function abrirNovo() {
    form.id = null;
    form.nome = '';
    form.descricao = '';
    modoEdicao.value = false;
    showForm.value = true;
}

function editar(item) {
    form.id = item.id;
    form.nome = item.nome;
    form.descricao = item.descricao || '';
    modoEdicao.value = true;
    showForm.value = true;
}

async function salvar() {
    if (!form.nome) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'O nome da permissão é obrigatório.' });
        return;
    }
    try {
        const resposta = modoEdicao.value
            ? await permissoesApi.update(form.id, { nome: form.nome, descricao: form.descricao })
            : await permissoesApi.create({ nome: form.nome, descricao: form.descricao });
        if (resposta.success) {
            showForm.value = false;
            await carregar();
            toast.add({ severity: 'success', summary: 'Sucesso', detail: modoEdicao.value ? 'Permissão actualizada.' : 'Permissão criada.' });
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: resposta.error });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Erro ao guardar permissão.' });
    }
}

async function remover(id) {
    if (!window.confirm('Eliminar esta permissão?')) return;
    try {
        const resposta = await permissoesApi.remove(id);
        if (resposta.success) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Permissão eliminada.' });
            await carregar();
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: resposta.error });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Erro ao eliminar permissão.' });
    }
}

</script>

<template>
    <div class="crud-page">
        <Toast />
        <div class="page-header">
            <h1 class="text-2xl font-bold text-sias-800">Gestão de Permissões</h1>
            <p class="text-sias-600">Gerencie as permissões de acesso do sistema.</p>
        </div>

        <div class="toolbar">
            <InputText v-model="search.value" placeholder="Pesquisar por nome ou descrição" />
            <Button label="Nova Permissão" icon="pi pi-plus" outlined @click="abrirNovo" />
        </div>

        <Card class="mt-4">
            <DataTable :value="permissoes" :paginator="true" :rows="10" dataKey="id" :loading="loading" emptyMessage="Nenhuma permissão encontrada.">
                <template #header>
                    <span>Permissões ({{ permissoes.value.length }})</span>
                </template>
                <Column field="nome" header="Nome / Código" sortable />
                <Column field="descricao" header="Descrição" />
                <Column field="acoes" header="Ações" style="width: 200px; text-align: center">
                    <template #body="slotProps">
                        <div class="flex justify-content-center gap-2">
                            <Button icon="pi pi-pencil" outlined rounded class="btn-edit" @click="editar(slotProps.data)" />
                            <Button icon="pi pi-trash" outlined severity="danger" rounded class="btn-delete" @click="remover(slotProps.data.id)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </Card>

        <Dialog v-model:visible="showForm" :header="modoEdicao ? 'Editar Permissão' : 'Nova Permissão'" :modal="true" style="width: 500px">
            <div class="flex flex-col gap-3">
                <InputText v-model="form.nome" label="Nome (código)" placeholder="Ex: UTILIZADORES_VISUALIZAR" />
                <InputText v-model="form.descricao" label="Descrição" />
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
    flex-wrap: wrap;
}
</style>
