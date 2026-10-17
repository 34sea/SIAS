<script setup>
import { ref, reactive, onMounted } from 'vue';
import { rolesApi } from '@/api/roles';
import { permissoesApi } from '@/api/permissoes';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const roles = ref([]);
const loading = ref(false);
const error = ref(null);

const form = reactive({ id: null, nome: '', descricao: '' });
const showForm = ref(false);
const modoEdicao = ref(false);

const todasPermissoes = ref([]);
const permissoesSelecionadas = ref([]);
const showPermDialog = ref(false);
const perfilSelecionado = ref(null);

onMounted(async () => {
    await carregar();
    await carregarPermissoes();
});

async function carregar() {
    loading.value = true;
    try {
        const resposta = await rolesApi.list();
        roles.value = resposta.data || resposta;
    } catch (err) {
        error.value = err.message || 'Erro ao listar perfis.';
        toast.add({ severity: 'error', summary: 'Erro', detail: error.value });
    } finally {
        loading.value = false;
    }
}

async function carregarPermissoes() {
    try {
        const resposta = await permissoesApi.list();
        todasPermissoes.value = resposta.data || resposta;
    } catch (err) {
        console.error(err);
    }
}

function abrirNovo() {
    form.id = null;
    form.nome = '';
    form.descricao = '';
    permissoesSelecionadas.value = [];
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
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'O nome do perfil é obrigatório.' });
        return;
    }
    try {
        const resposta = modoEdicao.value
            ? await rolesApi.update(form.id, { nome: form.nome, descricao: form.descricao })
            : await rolesApi.create({ nome: form.nome, descricao: form.descricao });
        if (resposta.success) {
            showForm.value = false;
            await carregar();
            toast.add({ severity: 'success', summary: 'Sucesso', detail: modoEdicao.value ? 'Perfil actualizado.' : 'Perfil criado.' });
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: resposta.error });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Erro ao guardar perfil.' });
    }
}

async function verPermissoes(item) {
    perfilSelecionado.value = item;
    try {
        const resposta = await rolesApi.getPermissions(item.id);
        permissoesSelecionadas.value = (resposta.data?.permissoes || []).map(p => p.id);
    } catch (err) {
        permissoesSelecionadas.value = [];
    }
    showPermDialog.value = true;
}

async function atribuirPermissoes() {
    if (!perfilSelecionado.value?.id) return;
    try {
        await rolesApi.assignPermissions(perfilSelecionado.value.id, permissoesSelecionadas.value);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Permissões atribuídas com sucesso.' });
        showPermDialog.value = false;
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Erro ao atribuir permissões.' });
    }
}

async function remover(id) {
    if (!window.confirm('Eliminar este perfil?')) return;
    try {
        const resposta = await rolesApi.remove(id);
        if (resposta.success) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Perfil eliminado.' });
            await carregar();
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: resposta.error });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Erro ao eliminar perfil.' });
    }
}

</script>

<template>
    <div class="crud-page">
        <Toast />
        <div class="page-header">
            <h1 class="text-2xl font-bold">Gestão de Perfis (Roles)</h1>
            <p class="text-sias-text-secondary">Gerencie os perfis de acesso do sistema.</p>
        </div>

        <div class="toolbar">
            <Button label="Novo Perfil" icon="pi pi-plus" outlined @click="abrirNovo" />
        </div>

        <Card class="mt-4">
            <DataTable :value="roles" :paginator="true" :rows="10" dataKey="id" :loading="loading" emptyMessage="Nenhum perfil encontrado.">
                <template #header>
                    <span>Perfis ({{ roles.value.length }})</span>
                </template>
                <Column field="nome" header="Nome" sortable />
                <Column field="descricao" header="Descrição" />
                <Column field="acoes" header="Ações" style="width: 260px; text-align: center">
                    <template #body="slotProps">
                        <div class="flex justify-content-center gap-2">
                            <Button icon="pi pi-pencil" outlined rounded class="btn-edit" @click="editar(slotProps.data)" />
                            <Button icon="pi pi-key" outlined rounded @click="verPermissoes(slotProps.data)" />
                            <Button icon="pi pi-trash" outlined severity="danger" rounded class="btn-delete" @click="remover(slotProps.data.id)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </Card>

        <Dialog v-model:visible="showForm" :header="modoEdicao ? 'Editar Perfil' : 'Novo Perfil'" :modal="true" style="width: 500px">
            <div class="flex flex-col gap-3">
                <InputText v-model="form.nome" label="Nome do Perfil" placeholder="Ex: ADMIN, ESTUDANTE, DOCENTE" />
                <InputText v-model="form.descricao" label="Descrição" />
            </div>
            <template #footer>
                <Button label="Cancelar" outlined @click="showForm = false" />
                <Button label="Guardar" icon="pi pi-save" @click="salvar" />
            </template>
        </Dialog>

        <Dialog v-model:visible="showPermDialog" :header="`Permissões — ${perfilSelecionado?.nome}`" :modal="true" style="width: 600px">
            <div class="flex flex-col gap-3">
                <div class="checkbox-group">
                    <Checkbox v-model:checked="permissoesSelecionadas" :binary="true" :options="todasPermissoes.map(p => ({
                        label: p.nome,
                        value: p.id
                    }))" />
                </div>
                <div class="text-xs text-muted">
                    Selecione as permissões que este perfil deve possuir.
                </div>
            </div>
            <template #footer>
                <Button label="Fechar" outlined @click="showPermDialog = false" />
                <Button label="Atribuir Permissões" icon="pi pi-check" @click="atribuirPermissoes" />
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
.checkbox-group {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid var(--sias-border);
    border-radius: 6px;
    padding: 1rem;
    background: var(--sias-surface);
}
.crud-page {
    color: var(--sias-text-primary);
}
</style>
