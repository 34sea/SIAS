<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { rolesApi } from '@/api/roles';
import { permissoesApi } from '@/api/permissoes';

import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Checkbox from 'primevue/checkbox';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';

const toast = useToast();
const confirm = useConfirm();

const roles = ref([]);
const todasPermissoes = ref([]);
const loading = ref(false);
const saving = ref(false);
const showForm = ref(false);
const modoEdicao = ref(false);
const search = ref('');

const form = reactive({
    id: null,
    nome: '',
    descricao: ''
});

const permissoesSelecionadas = ref([]);
const showPermDialog = ref(false);
const perfilSelecionado = ref(null);

/*
 * Normalizadores idênticos aos da tela de Utilizadores
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
    if (Array.isArray(corpo?.roles)) return corpo.roles;
    if (Array.isArray(corpo?.permissoes)) return corpo.permissoes;
    return [];
}

function notificarSucesso(detail) {
    toast.add({ severity: 'success', summary: 'Sucesso', detail, life: 4000 });
}

function notificarErro(detail) {
    toast.add({ severity: 'error', summary: 'Erro', detail, life: 5000 });
}

// Estatísticas computadas
const totalRoles = computed(() => roles.value.length);
const totalPermissoes = computed(() => todasPermissoes.value.length);

const perfisFiltrados = computed(() => {
    const termo = search.value.trim().toLowerCase();
    if (!termo) return roles.value;

    return roles.value.filter((r) => {
        return [r.nome, r.descricao].some((valor) =>
            String(valor ?? '').toLowerCase().includes(termo)
        );
    });
});

function limparFormulario() {
    Object.assign(form, {
        id: null,
        nome: '',
        descricao: ''
    });
}

function abrirNovo() {
    limparFormulario();
    modoEdicao.value = false;
    showForm.value = true;
}

function editar(item) {
    limparFormulario();
    modoEdicao.value = true;
    Object.assign(form, {
        id: item.id,
        nome: item.nome ?? '',
        descricao: item.descricao ?? ''
    });
    showForm.value = true;
}

async function carregar() {
    loading.value = true;
    try {
        const resposta = await rolesApi.list();
        if (!operacaoBemSucedida(resposta)) {
            throw new Error(mensagemErro(resposta, 'Não foi possível carregar os perfis.'));
        }
        roles.value = extrairLista(resposta);
    } catch (erro) {
        notificarErro(erro?.message || 'Ocorreu um erro ao carregar os perfis.');
    } finally {
        loading.value = false;
    }
}

async function carregarPermissoes() {
    try {
        const resposta = await permissoesApi.list();
        if (!operacaoBemSucedida(resposta)) {
            throw new Error(mensagemErro(resposta, 'Não foi possível carregar as permissões.'));
        }
        todasPermissoes.value = extrairLista(resposta);
    } catch (erro) {
        console.error('Erro ao carregar permissões:', erro);
    }
}

async function salvar() {
    if (!form.nome.trim()) {
        notificarErro('Preencha o nome do perfil.');
        return;
    }

    saving.value = true;
    try {
        const dados = {
            nome: form.nome.trim(),
            descricao: form.descricao.trim()
        };

        const resposta = modoEdicao.value
            ? await rolesApi.update(form.id, dados)
            : await rolesApi.create(dados);

        if (operacaoBemSucedida(resposta)) {
            notificarSucesso(modoEdicao.value ? 'Perfil actualizado.' : 'Perfil criado.');
            showForm.value = false;
            limparFormulario();
            await carregar();
        } else {
            notificarErro(mensagemErro(resposta, 'A API não confirmou a operação.'));
        }
    } catch (erro) {
        notificarErro(mensagemErro(erro?.response ?? erro, erro?.message || 'Não foi possível guardar o perfil.'));
    } finally {
        saving.value = false;
    }
}

async function verPermissoes(item) {
    perfilSelecionado.value = item;
    try {
        const resposta = await rolesApi.getPermissions(item.id);
        const lista = extrairLista(resposta);
        
        // Mapeia caso venham objetos ou IDs diretos
        permissoesSelecionadas.value = lista.map((p) => typeof p === 'object' ? p.id : p);
    } catch (err) {
        permissoesSelecionadas.value = [];
    }
    showPermDialog.value = true;
}

async function atribuirPermissoes() {
    if (!perfilSelecionado.value?.id) return;

    saving.value = true;
    try {
        const resposta = await rolesApi.assignPermissions(
            perfilSelecionado.value.id,
            permissoesSelecionadas.value
        );

        if (operacaoBemSucedida(resposta)) {
            notificarSucesso('Permissões atribuídas com sucesso.');
            showPermDialog.value = false;
        } else {
            notificarErro(mensagemErro(resposta, 'Não foi possível guardar as permissões.'));
        }
    } catch (erro) {
        notificarErro(mensagemErro(erro?.response ?? erro, erro?.message || 'Erro ao atribuir permissões.'));
    } finally {
        saving.value = false;
    }
}

function confirmarRemocao(role) {
    confirm.require({
        message: `Tem a certeza de que deseja remover o perfil "${role.nome}"?`,
        header: 'Confirmar remoção',
        icon: 'pi pi-exclamation-triangle',
        rejectLabel: 'Cancelar',
        acceptLabel: 'Remover',
        acceptClass: 'p-button-danger',
        accept: () => remover(role.id)
    });
}

async function remover(id) {
    try {
        const resposta = await rolesApi.remove(id);
        if (operacaoBemSucedida(resposta)) {
            notificarSucesso('Perfil removido.');
            await carregar();
        } else {
            notificarErro(mensagemErro(resposta, 'Não foi possível remover o perfil.'));
        }
    } catch (erro) {
        notificarErro(mensagemErro(erro?.response ?? erro, erro?.message || 'Falha ao remover o perfil.'));
    }
}

onMounted(async () => {
    await Promise.all([carregar(), carregarPermissoes()]);
});
</script>

<template>
    <Toast />
    <ConfirmDialog />

    <div class="perfis-page">
        <!-- Cabeçalho Principal -->
        <div class="page-header">
            <div>
                <h1>Gestão de Perfis</h1>
                <p>Consulte e administre os perfis de acesso (roles) e atribuição de permissões do sistema.</p>
            </div>
            <Button label="Novo" icon="pi pi-plus" class="btn-primary-custom" @click="abrirNovo" />
        </div>

        <!-- Cartões de Estatísticas -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon-wrapper bg-blue-50 text-blue-600">
                    <i class="pi pi-id-card text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Total de Perfis</span>
                    <h3 class="stat-value">{{ totalRoles }}</h3>
                    <span class="stat-trend text-blue-600">Registados</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrapper bg-purple-50 text-purple-600">
                    <i class="pi pi-key text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Permissões do Sistema</span>
                    <h3 class="stat-value">{{ totalPermissoes }}</h3>
                    <span class="stat-trend text-purple-600">Disponíveis</span>
                </div>
            </div>
        </div>

        <!-- Barra de Ferramentas e Filtros -->
        <div class="toolbar-card">
            <div class="search-wrapper">
                <InputText v-model="search" placeholder="Pesquisar perfis por nome ou descrição..." class="search-input" />
            </div>
            
            <div class="filters-group">
                <Button icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="carregar" v-tooltip.top="'Atualizar lista'" />
            </div>
        </div>

        <!-- Tabela de Perfis com thead e padding idênticos aos de utilizadores -->
        <DataTable :value="perfisFiltrados" :loading="loading" dataKey="id" paginator :rows="10"
            :rowsPerPageOptions="[5, 10, 20]" stripedRows responsiveLayout="scroll"
            class="p-datatable-custom shadow-sm border rounded-xl overflow-hidden"
            emptyMessage="Nenhum perfil encontrado.">
            
            <Column field="nome" header="Nome do Perfil" sortable style="min-width: 14rem;">
                <template #body="{ data }">
                    <div class="role-cell">
                        <Tag severity="info" :value="data.nome" rounded />
                    </div>
                </template>
            </Column>

            <Column field="descricao" header="Descrição" style="min-width: 22rem;">
                <template #body="{ data }">
                    <span class="text-slate-600 font-medium">{{ data.descricao || '—' }}</span>
                </template>
            </Column>

            <Column header="Ações" style="width: 10rem; text-align: center;">
                <template #body="{ data }">
                    <div class="action-buttons">
                        <Button icon="pi pi-pencil" severity="info" text rounded aria-label="Editar"
                            v-tooltip.top="'Editar perfil'" @click="editar(data)" />
                        <Button icon="pi pi-key" severity="warning" text rounded aria-label="Permissões"
                            v-tooltip.top="'Gerir permissões'" @click="verPermissoes(data)" />
                        <Button icon="pi pi-trash" severity="danger" text rounded aria-label="Remover"
                            v-tooltip.top="'Remover perfil'" @click="confirmarRemocao(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Diálogo de Criação / Edição de Perfil -->
        <Dialog v-model:visible="showForm" :header="modoEdicao ? 'Editar Perfil' : 'Perfil'" modal
            :style="{ width: 'min(95vw, 560px)' }" :closable="!saving">
            <form class="role-form" @submit.prevent="salvar">
                <div class="field">
                    <label for="nome">Nome do Perfil *</label>
                    <InputText id="nome" v-model="form.nome" required class="w-full form-input"
                        placeholder="Ex: ADMIN, ESTUDANTE, DOCENTE" />
                </div>

                <div class="field">
                    <label for="descricao">Descrição</label>
                    <InputText id="descricao" v-model="form.descricao" class="w-full form-input"
                        placeholder="Descreva as funções deste perfil" />
                </div>

                <div class="form-actions">
                    <Button type="button" label="Cancelar" severity="secondary" outlined :disabled="saving"
                        @click="showForm = false" />
                    <Button type="submit" :label="modoEdicao ? 'Guardar' : 'Salvar'"
                        icon="pi pi-check" :loading="saving" class="btn-primary-custom" />
                </div>
            </form>
        </Dialog>

        <!-- Diálogo de Atribuição de Permissões -->
        <Dialog v-model:visible="showPermDialog" :header="`Permissões — ${perfilSelecionado?.nome}`" modal
            :style="{ width: 'min(95vw, 680px)' }" :closable="!saving">
            <div class="perm-dialog-body">
                <p class="text-sm text-slate-500 mb-3">
                    Selecione as permissões que o perfil <strong class="text-slate-800">{{ perfilSelecionado?.nome }}</strong> terá no sistema:
                </p>

                <div class="permissions-grid">
                    <div v-for="p in todasPermissoes" :key="p.id" class="perm-card">
                        <Checkbox :inputId="`perm_${p.id}`" :value="p.id" v-model="permissoesSelecionadas" />
                        <label :for="`perm_${p.id}`" class="perm-label">
                            <span class="perm-name">{{ p.nome }}</span>
                            <small class="perm-desc">{{ p.descricao }}</small>
                        </label>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="form-actions">
                    <Button label="Cancelar" severity="secondary" outlined :disabled="saving" @click="showPermDialog = false" />
                    <Button label="Atribuir Permissões" icon="pi pi-check" :loading="saving" class="btn-primary-custom" @click="atribuirPermissoes" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.perfis-page {
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

/* thead e linhas expansivas idênticas aos utilizadores */
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

.role-cell {
    display: flex;
    align-items: center;
}

.action-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
}

.role-form {
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

/* Grelha de permissões moderna com Checkbox */
.permissions-grid {
    max-height: 360px;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 0.75rem;
    padding: 0.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #f8fafc;
}

.perm-card {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.85rem;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    transition: all 0.15s ease;
}

.perm-card:hover {
    border-color: #2563eb;
    background-color: #f1f5f9;
}

.perm-label {
    cursor: pointer;
    display: flex;
    flex-direction: column;
}

.perm-name {
    font-weight: 600;
    font-size: 0.88rem;
    color: #1e293b;
}

.perm-desc {
    color: #64748b;
    font-size: 0.78rem;
    margin-top: 0.1rem;
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
    .permissions-grid {
        grid-template-columns: 1fr;
    }
}
</style>