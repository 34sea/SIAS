<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { permissoesApi } from '@/api/permissoes';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';

const toast = useToast();
const confirm = useConfirm();

const permissoes = ref([]);
const loading = ref(false);
const saving = ref(false);
const error = ref(null);
const search = ref('');

const form = reactive({ id: null, nome: '', descricao: '' });
const showForm = ref(false);
const modoEdicao = ref(false);

/*
 * Normalizadores padrão da aplicação
 */
function obterCorpo(resposta) {
    return resposta?.data ?? resposta;
}

function operacaoBemSucedida(resposta) {
    const status = Number(
        resposta?.status ??
        resposta?.statusCode ??
        resposta?.data?.status
    );

    if (status >= 200 && status < 300) {
        return true;
    }

    const corpo = obterCorpo(resposta);
    return corpo?.success === true;
}

function mensagemErro(resposta, alternativa) {
    const corpo = obterCorpo(resposta);
    return (
        corpo?.error ||
        corpo?.message ||
        corpo?.detail ||
        resposta?.message ||
        alternativa
    );
}

function extrairLista(resposta) {
    const corpo = obterCorpo(resposta);
    if (Array.isArray(corpo)) return corpo;
    if (Array.isArray(corpo?.data)) return corpo.data;
    if (Array.isArray(corpo?.data?.data)) return corpo.data.data;
    if (Array.isArray(corpo?.permissoes)) return corpo.permissoes;
    return [];
}

// Estatísticas Computadas
const totalPermissoes = computed(() => permissoes.value.length);

const permissoesFiltradas = computed(() => {
    const termo = search.value.trim().toLowerCase();
    if (!termo) return permissoes.value;

    return permissoes.value.filter((p) => {
        return [p.nome, p.descricao].some((valor) =>
            String(valor ?? '').toLowerCase().includes(termo)
        );
    });
});

onMounted(carregar);

async function carregar() {
    loading.value = true;
    try {
        const resposta = await permissoesApi.list();
        if (!operacaoBemSucedida(resposta)) {
            throw new Error(mensagemErro(resposta, 'Não foi possível carregar as permissões.'));
        }
        permissoes.value = extrairLista(resposta);
    } catch (err) {
        error.value = err.message || 'Erro ao listar permissões.';
        toast.add({ severity: 'error', summary: 'Erro', detail: error.value, life: 5000 });
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
    form.nome = item.nome || '';
    form.descricao = item.descricao || '';
    modoEdicao.value = true;
    showForm.value = true;
}

async function salvar() {
    if (!form.nome.trim()) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'O nome da permissão é obrigatório.', life: 4000 });
        return;
    }

    saving.value = true;
    try {
        const dados = {
            nome: form.nome.trim(),
            descricao: form.descricao.trim()
        };

        const resposta = modoEdicao.value
            ? await permissoesApi.update(form.id, dados)
            : await permissoesApi.create(dados);

        if (operacaoBemSucedida(resposta)) {
            showForm.value = false;
            await carregar();
            toast.add({ severity: 'success', summary: 'Sucesso', detail: modoEdicao.value ? 'Permissão actualizada.' : 'Permissão criada.', life: 4000 });
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(resposta, 'A API não confirmou a operação.'), life: 5000 });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(err?.response ?? err, 'Erro ao guardar permissão.'), life: 5000 });
    } finally {
        saving.value = false;
    }
}

function confirmarRemocao(item) {
    confirm.require({
        message: `Tem a certeza de que deseja eliminar a permissão "${item.nome}"?`,
        header: 'Confirmar remoção',
        icon: 'pi pi-exclamation-triangle',
        rejectLabel: 'Cancelar',
        acceptLabel: 'Remover',
        acceptClass: 'p-button-danger',
        accept: () => remover(item.id)
    });
}

async function remover(id) {
    try {
        const resposta = await permissoesApi.remove(id);
        if (operacaoBemSucedida(resposta)) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Permissão eliminada.', life: 4000 });
            await carregar();
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(resposta, 'Erro ao eliminar.'), life: 5000 });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(err?.response ?? err, 'Erro ao eliminar permissão.'), life: 5000 });
    }
}
</script>

<template>
    <Toast />
    <ConfirmDialog />

    <div class="permissoes-page">
        <!-- Cabeçalho Principal -->
        <div class="page-header">
            <div>
                <h1>Gestão de Permissões</h1>
                <p>Consulte e administre as permissões de acesso granulares do sistema.</p>
            </div>
            <Button label="Adicionar Nova Permissão" icon="pi pi-plus" class="btn-primary-custom" @click="abrirNovo" />
        </div>

        <!-- Cartões de Estatísticas -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon-wrapper bg-blue-50 text-blue-600">
                    <i class="pi pi-shield text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Total de Permissões</span>
                    <h3 class="stat-value">{{ totalPermissoes }}</h3>
                    <span class="stat-trend text-blue-600">Registadas</span>
                </div>
            </div>
        </div>

        <!-- Barra de Ferramentas e Filtros -->
        <div class="toolbar-card">
            <div class="search-wrapper">
                <InputText v-model="search" placeholder="Pesquisar por nome ou descrição..." class="search-input" />
            </div>
            
            <div class="filters-group">
                <Button icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="carregar" v-tooltip.top="'Atualizar lista'" />
            </div>
        </div>

        <!-- Tabela de Permissões (Padrão idêntico à tela de utilizadores e perfis) -->
        <DataTable :value="permissoesFiltradas" :loading="loading" dataKey="id" paginator :rows="10"
            :rowsPerPageOptions="[5, 10, 20, 50]" stripedRows responsiveLayout="scroll"
            class="p-datatable-custom shadow-sm border rounded-xl overflow-hidden"
            emptyMessage="Nenhuma permissão encontrada.">
            
            <Column field="nome" header="Nome / Código" sortable style="min-width: 16rem;">
                <template #body="{ data }">
                    <div class="perm-cell">
                        <Tag severity="info" :value="data.nome" rounded />
                    </div>
                </template>
            </Column>

            <Column field="descricao" header="Descrição" style="min-width: 22rem;">
                <template #body="{ data }">
                    <span class="text-slate-600 font-medium">{{ data.descricao || '—' }}</span>
                </template>
            </Column>

            <Column header="Ações" style="width: 8rem; text-align: center;">
                <template #body="{ data }">
                    <div class="action-buttons">
                        <Button icon="pi pi-pencil" severity="info" text rounded aria-label="Editar"
                            v-tooltip.top="'Editar permissão'" @click="editar(data)" />
                        <Button icon="pi pi-trash" severity="danger" text rounded aria-label="Remover"
                            v-tooltip.top="'Remover permissão'" @click="confirmarRemocao(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Diálogo de Criação / Edição -->
        <Dialog v-model:visible="showForm" :header="modoEdicao ? 'Editar Permissão' : 'Adicionar Nova Permissão'" modal
            :style="{ width: 'min(95vw, 560px)' }" :closable="!saving">
            <form class="perm-form" @submit.prevent="salvar">
                <div class="field">
                    <label for="nome">Nome / Código *</label>
                    <InputText id="nome" v-model="form.nome" required class="w-full form-input"
                        placeholder="Ex: UTILIZADORES_VISUALIZAR" />
                </div>

                <div class="field">
                    <label for="descricao">Descrição</label>
                    <InputText id="descricao" v-model="form.descricao" class="w-full form-input"
                        placeholder="Descreva o propósito desta permissão" />
                </div>

                <div class="form-actions">
                    <Button type="button" label="Cancelar" severity="secondary" outlined :disabled="saving"
                        @click="showForm = false" />
                    <Button type="submit" :label="modoEdicao ? 'Guardar' : 'Salvar'"
                        icon="pi pi-check" :loading="saving" class="btn-primary-custom" />
                </div>
            </form>
        </Dialog>

        <div v-if="error" class="p-3 text-red-500 bg-red-50 rounded mt-4 border border-red-200">Erro: {{ error }}</div>
    </div>
</template>

<style scoped>
.permissoes-page {
    padding: 1.5rem;
    background-color: #f8fafc;
    min-height: 100vh;
}

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.page-header h1 {
    margin: 0 0 0.25rem;
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
}

.page-header p {
    margin: 0;
    color: #64748b;
    font-size: 0.9rem;
}

/* Botões com a paleta #2563eb */
.btn-primary-custom {
    background-color: #2563eb !important;
    border-color: #2563eb !important;
}
.btn-primary-custom:hover {
    background-color: #1d4ed8 !important;
    border-color: #1d4ed8 !important;
}

/* Grelha de Estatísticas */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.stat-card {
    background: #ffffff;
    padding: 1.25rem;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.stat-icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.stat-label {
    font-size: 0.8rem;
    color: #64748b;
    font-weight: 500;
    display: block;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0.15rem 0;
}

.stat-trend {
    font-size: 0.75rem;
    font-weight: 600;
}

/* Barra de ferramentas */
.toolbar-card {
    background: #ffffff;
    padding: 1rem;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.search-wrapper {
    flex: 1;
    min-width: 260px;
}

.search-input {
    width: 100%;
}

.filters-group {
    display: flex;
    gap: 0.75rem;
    align-items: center;
}

/* thead e linhas expansivas idênticas aos utilizadores e perfis */
:deep(.p-datatable-custom .p-datatable-thead > tr > th) {
    padding-top: 1.2rem !important;
    padding-bottom: 1.2rem !important;
    font-size: 0.95rem;
    font-weight: 600;
    background-color: #f1f5f9 !important;
    color: #334155 !important;
    min-height: 55px;
}

:deep(.p-datatable-custom .p-datatable-tbody > tr > td) {
    padding: 1.15rem 1.25rem !important;
}

.perm-cell {
    display: flex;
    align-items: center;
}

.action-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
}

.perm-form {
    display: grid;
    gap: 1.1rem;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
}

.field label {
    font-weight: 500;
    color: #334155;
    font-size: 0.9rem;
}

.form-input {
    height: 48px;
}

.w-full {
    width: 100%;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1rem;
    border-top: 1px solid #e2e8f0;
    padding-top: 1rem;
}

@media (max-width: 768px) {
    .toolbar-card, .page-header {
        flex-direction: column;
        align-items: stretch;
    }
}
</style>