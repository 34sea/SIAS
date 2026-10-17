<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { usersApi } from '@/api/users';
import { rolesApi } from '@/api/roles';

import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import Password from 'primevue/password';
import Tag from 'primevue/tag';
import Checkbox from 'primevue/checkbox';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';

const API_URL = 'http://localhost:5000/';
const toast = useToast();
const confirm = useConfirm();

const users = ref([]);
const roles = ref([]);
const loading = ref(false);
const saving = ref(false);
const showForm = ref(false);
const modoEdicao = ref(false);
const search = ref('');
const selectedRoleFilter = ref(null);
const selectedStatusFilter = ref(null);

const fotoInput = ref(null);
const fotoPreview = ref('');

const form = reactive({
    id: null,
    nome_completo: '',
    email: '',
    username: '',
    password_hash: '',
    role_id: null,
    estado: 1,
    foto: null
});

// Gera automaticamente o username com base no nome completo durante a criação
watch(() => form.nome_completo, (novoNome) => {
    if (!modoEdicao.value && novoNome) {
        form.username = novoNome
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
    }
});

// Estatísticas computadas
const totalUsers = computed(() => users.value.length);
const activeUsers = computed(() => users.value.filter(u => Number(u.estado) === 1).length);
const inactiveUsers = computed(() => totalUsers.value - activeUsers.value);
const adminUsers = computed(() => users.value.filter(u => {
    const roleName = (u.role_nome || u.role?.nome || roles.value.find(r => r.id === u.role_id)?.nome || '').toLowerCase();
    return roleName.includes('admin');
}).length);

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
    if (Array.isArray(corpo?.users)) return corpo.users;
    if (Array.isArray(corpo?.utilizadores)) return corpo.utilizadores;
    return [];
}

const roleOptions = computed(() =>
    roles.value.map((role) => ({
        label: role.nome,
        value: role.id
    }))
);

const roleFilterOptions = computed(() => [
    { label: 'Todos os Perfis', value: null },
    ...roles.value.map(r => ({ label: r.nome, value: r.id }))
]);

const statusFilterOptions = [
    { label: 'Todos os Estados', value: null },
    { label: 'Ativo', value: 1 },
    { label: 'Inativo', value: 0 }
];

const utilizadoresFiltrados = computed(() => {
    const termo = search.value.trim().toLowerCase();

    return users.value.filter((user) => {
        const correspondeTermo = !termo || [
            user.nome_completo,
            user.email,
            user.username,
            user.role_nome,
            user.role?.nome
        ].some((valor) => String(valor ?? '').toLowerCase().includes(termo));

        const userRole = user.role_id ?? user.role?.id;
        const correspondeRole = selectedRoleFilter.value === null || userRole === selectedRoleFilter.value;

        const userEstado = Number(user.estado) === 1;
        const filtroEstadoBool = selectedStatusFilter.value === null ? null : Number(selectedStatusFilter.value) === 1;
        const correspondeStatus = filtroEstadoBool === null || userEstado === filtroEstadoBool;

        return correspondeTermo && correspondeRole && correspondeStatus;
    });
});

function notificarSucesso(detail) {
    toast.add({ severity: 'success', summary: 'Sucesso', detail, life: 4000 });
}

function notificarErro(detail) {
    toast.add({ severity: 'error', summary: 'Erro', detail, life: 5000 });
}

function limparFormulario() {
    Object.assign(form, {
        id: null,
        nome_completo: '',
        email: '',
        username: '',
        password_hash: '',
        role_id: null,
        estado: 1,
        foto: null
    });
    fotoPreview.value = '';
    if (fotoInput.value) fotoInput.value.value = '';
}

function abrirCriacao() {
    limparFormulario();
    modoEdicao.value = false;
    showForm.value = true;
}

function abrirEdicao(user) {
    limparFormulario();
    modoEdicao.value = true;
    Object.assign(form, {
        id: user.id,
        nome_completo: user.nome_completo ?? '',
        email: user.email ?? '',
        username: user.username ?? '',
        password_hash: '',
        role_id: user.role_id ?? user.role?.id ?? null,
        estado: Number(user.estado ?? 1),
        foto: null
    });
    
    if (user.foto_url) {
        fotoPreview.value = user.foto_url;
    } else if (user.foto) {
        fotoPreview.value = user.foto.startsWith('http') ? user.foto : `${API_URL}${user.foto}`;
    } else {
        fotoPreview.value = '';
    }
    
    showForm.value = true;
}

function seleccionarFoto(event) {
    const ficheiro = event.target.files?.[0];
    if (!ficheiro) return;
    if (!ficheiro.type.startsWith('image/')) {
        notificarErro('Seleccione um ficheiro de imagem válido.');
        event.target.value = '';
        return;
    }
    form.foto = ficheiro;
    fotoPreview.value = URL.createObjectURL(ficheiro);
}

function construirFormData() {
    const fd = new FormData();
    fd.append('nome_completo', form.nome_completo.trim());
    fd.append('email', form.email.trim());
    fd.append('username', form.username.trim());
    fd.append('role_id', String(form.role_id));
    fd.append('estado', form.estado ? '1' : '0');

    if (form.password_hash) {
        fd.append('password_hash', form.password_hash);
    }
    if (form.foto instanceof File) {
        fd.append('foto', form.foto);
    }
    return fd;
}

async function carregar() {
    loading.value = true;
    try {
        const resposta = await usersApi.list();
        if (!operacaoBemSucedida(resposta)) {
            throw new Error(mensagemErro(resposta, 'Não foi possível carregar os utilizadores.'));
        }
        users.value = extrairLista(resposta);
    } catch (erro) {
        notificarErro(erro?.message || 'Ocorreu um erro ao carregar os utilizadores.');
    } finally {
        loading.value = false;
    }
}

async function carregarRoles() {
    try {
        const resposta = await rolesApi.list();
        if (!operacaoBemSucedida(resposta)) {
            throw new Error(mensagemErro(resposta, 'Não foi possível carregar os perfis.'));
        }
        roles.value = extrairLista(resposta);
    } catch (erro) {
        notificarErro(erro?.message || 'Ocorreu um erro ao carregar os perfis.');
    }
}

async function salvar() {
    if (!form.nome_completo.trim() || !form.email.trim() || !form.username.trim() || !form.role_id) {
        notificarErro('Preencha todos os campos obrigatórios.');
        return;
    }
    if (!modoEdicao.value && !form.password_hash) {
        notificarErro('A palavra-passe é obrigatória.');
        return;
    }

    saving.value = true;
    try {
        const fd = construirFormData();
        const resposta = modoEdicao.value
            ? await usersApi.update(fd, form.id)
            : await usersApi.create(fd);

        if (operacaoBemSucedida(resposta)) {
            notificarSucesso(modoEdicao.value ? 'Utilizador actualizado.' : 'Utilizador criado.');
            showForm.value = false;
            limparFormulario();
            await carregar();
        } else {
            notificarErro(mensagemErro(resposta, 'A API não confirmou a operação.'));
        }
    } catch (erro) {
        notificarErro(mensagemErro(erro?.response ?? erro, erro?.message || 'Não foi possível guardar o utilizador.'));
    } finally {
        saving.value = false;
    }
}

function confirmarRemocao(user) {
    confirm.require({
        message: `Tem a certeza de que deseja remover ${user.nome_completo}?`,
        header: 'Confirmar remoção',
        icon: 'pi pi-exclamation-triangle',
        rejectLabel: 'Cancelar',
        acceptLabel: 'Remover',
        acceptClass: 'p-button-danger',
        accept: () => remover(user)
    });
}

async function remover(user) {
    try {
        const resposta = await usersApi.remove(user.id);
        if (operacaoBemSucedida(resposta)) {
            notificarSucesso('Utilizador removido.');
            await carregar();
        } else {
            notificarErro(mensagemErro(resposta, 'Não foi possível remover o utilizador.'));
        }
    } catch (erro) {
        notificarErro(mensagemErro(erro?.response ?? erro, erro?.message || 'Falha ao remover o utilizador.'));
    }
}

onMounted(async () => {
    await Promise.all([carregar(), carregarRoles()]);
});
</script>

<template>
    <Toast />
    <ConfirmDialog />

    <div class="utilizadores-page">
        <!-- Cabeçalho Principal -->
        <div class="page-header">
            <div>
                <h1>Gestão de Utilizadores</h1>
                <p>Consulte e administre os utilizadores do sistema, perfis e permissões.</p>
            </div>
            <Button label="Novo" icon="pi pi-plus" class="btn-primary-custom" @click="abrirCriacao" />
        </div>

        <!-- Cartões de Estatísticas -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon-wrapper bg-blue-50 text-blue-600">
                    <i class="pi pi-users text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Total de Utilizadores</span>
                    <h3 class="stat-value">{{ totalUsers }}</h3>
                    <span class="stat-trend text-blue-600">Geral</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrapper bg-emerald-50 text-emerald-600">
                    <i class="pi pi-user text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Utilizadores Ativos</span>
                    <h3 class="stat-value">{{ activeUsers }}</h3>
                    <span class="stat-trend text-emerald-600">Operacionais</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrapper bg-red-50 text-red-600">
                    <i class="pi pi-user-minus text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Utilizadores Inativos</span>
                    <h3 class="stat-value">{{ inactiveUsers }}</h3>
                    <span class="stat-trend text-red-600">Suspensos</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrapper bg-purple-50 text-purple-600">
                    <i class="pi pi-shield text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Administradores</span>
                    <h3 class="stat-value">{{ adminUsers }}</h3>
                    <span class="stat-trend text-purple-600">Gestores</span>
                </div>
            </div>
        </div>

        <!-- Barra de Ferramentas e Filtros -->
        <div class="toolbar-card">
            <div class="search-wrapper">
                <InputText v-model="search" placeholder="Pesquisar utilizadores por nome, email..." class="search-input" />
            </div>
            
            <div class="filters-group">
                <Dropdown v-model="selectedRoleFilter" :options="roleFilterOptions" optionLabel="label" optionValue="value" placeholder="Todos os Perfis" class="filter-dropdown" />
                <Dropdown v-model="selectedStatusFilter" :options="statusFilterOptions" optionLabel="label" optionValue="value" placeholder="Todos os Estados" class="filter-dropdown" />
                <Button icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="carregar" v-tooltip.top="'Atualizar lista'" />
            </div>
        </div>

        <!-- Tabela de Utilizadores com thead expandido -->
        <DataTable :value="utilizadoresFiltrados" :loading="loading" dataKey="id" paginator :rows="10"
            :rowsPerPageOptions="[5, 10, 20, 50]" stripedRows responsiveLayout="scroll"
            class="p-datatable-custom shadow-sm border rounded-xl overflow-hidden"
            emptyMessage="Nenhum utilizador encontrado.">
            
            <Column header="Utilizador" sortable sortField="nome_completo" style="min-width: 16rem;">
                <template #body="{ data }">
                    <div class="user-cell">
                        <img v-if="data.foto_url || data.foto" :src="data.foto_url ? data.foto_url : `${API_URL}${data.foto}`"
                            alt="Fotografia" class="user-avatar" />
                        <div v-else class="user-avatar avatar-placeholder">
                            <i class="pi pi-user" />
                        </div>
                        <div>
                            <strong>{{ data.nome_completo }}</strong>
                            <small>{{ data.username }}</small>
                        </div>
                    </div>
                </template>
            </Column>

            <Column field="email" header="Email" sortable style="min-width: 14rem;" />

            <Column header="Perfil" style="min-width: 10rem;">
                <template #body="{ data }">
                    <Tag severity="info" :value="data.role_nome || data.role?.nome || roles.find(r => r.id === data.role_id)?.nome || '—'" rounded />
                </template>
            </Column>

            <Column header="Estado" style="width: 10rem;">
                <template #body="{ data }">
                    <Tag :value="Number(data.estado) === 1 ? 'Ativo' : 'Inativo'"
                        :severity="Number(data.estado) === 1 ? 'success' : 'danger'" />
                </template>
            </Column>

            <Column header="Ações" style="width: 8rem; text-align: center;">
                <template #body="{ data }">
                    <div class="action-buttons">
                        <Button icon="pi pi-pencil" severity="info" text rounded aria-label="Editar"
                            v-tooltip.top="'Editar utilizador'" @click="abrirEdicao(data)" />
                        <Button icon="pi pi-trash" severity="danger" text rounded aria-label="Remover"
                            v-tooltip.top="'Remover utilizador'" @click="confirmarRemocao(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Diálogo de Criação / Edição -->
        <Dialog v-model:visible="showForm" :header="modoEdicao ? 'Editar Utilizador' : 'Novo Utilizador'" modal
            :style="{ width: 'min(95vw, 620px)' }" :closable="!saving">
            <form class="user-form" @submit.prevent="salvar">
                
                <!-- Upload de Fotografia Estilo Moderno Dropzone -->
                <div class="field">
                    <label>Fotografia de Perfil</label>
                    <div class="dropzone-container" @click="$refs.fotoInput.click()">
                        <div v-if="!fotoPreview" class="dropzone-content">
                            <i class="pi pi-cloud-upload text-3xl text-blue-600 mb-2"></i>
                            <span class="font-medium text-gray-700">Clique para carregar uma imagem</span>
                            <span class="text-xs text-gray-400">PNG, JPG, JPEG (máx. permitida)</span>
                        </div>
                        <div v-else class="preview-container">
                            <img :src="fotoPreview" alt="Pré-visualização" class="photo-preview-box" />
                            <span class="text-xs text-blue-600 font-medium mt-1">Clique para alterar a imagem</span>
                        </div>
                    </div>
                    <input id="foto" ref="fotoInput" type="file" accept="image/*" class="hidden-file-input" @change="seleccionarFoto" />
                </div>

                <div class="field">
                    <label for="nome_completo">Nome completo *</label>
                    <InputText id="nome_completo" v-model="form.nome_completo" required class="w-full form-input"
                        autocomplete="name" placeholder="Insira o nome completo" />
                </div>

                <div class="field">
                    <label for="email">Email *</label>
                    <InputText id="email" v-model="form.email" type="email" required class="w-full form-input"
                        autocomplete="email" placeholder="exemplo@email.com" />
                </div>

                <div class="field">
                    <label for="username">Nome de utilizador (gerado automaticamente) *</label>
                    <InputText id="username" v-model="form.username" required class="w-full form-input" autocomplete="username" placeholder="nome_usuario" />
                </div>

                <div class="field">
                    <label for="password_hash">
                        Palavra-passe {{ modoEdicao ? '(deixe vazio para manter)' : '*' }}
                    </label>
                    <Password id="password_hash" v-model="form.password_hash" :required="!modoEdicao"
                        :feedback="!modoEdicao" toggleMask class="w-full" inputClass="w-full form-input"
                        autocomplete="new-password" placeholder="••••••••" />
                </div>

                <div class="field">
                    <label for="role_id">Perfil *</label>
                    <Dropdown id="role_id" v-model="form.role_id" :options="roleOptions" optionLabel="label"
                        optionValue="value" placeholder="Seleccione um perfil" class="w-full"
                        :loading="roles.length === 0" />
                </div>

                <div class="field checkbox-field">
                    <Checkbox v-model="form.estado" :binary="true" :trueValue="1" :falseValue="0" inputId="estado" />
                    <label for="estado">Utilizador ativo</label>
                </div>

                <div class="form-actions">
                    <Button type="button" label="Cancelar" severity="secondary" outlined :disabled="saving"
                        @click="showForm = false" class="btn-cancel" />
                    <Button type="submit" :label="modoEdicao ? 'Guardar' : 'Salvar'"
                        icon="pi pi-check" :loading="saving" class="btn-primary-custom" />
                </div>
            </form>
        </Dialog>
    </div>
</template>

<style scoped>
.utilizadores-page {
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

/* Botões personalizados com a paleta #2563eb */
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
    flex-wrap: wrap;
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
    flex-wrap: wrap;
}

.filter-dropdown {
    width: 170px;
}

/* Estilização e aumento expressivo de altura do thead e linhas */
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

.user-cell {
    display: flex;
    align-items: center;
    gap: 0.85rem;
}

.user-cell strong,
.user-cell small {
    display: block;
}

.user-cell strong {
    color: #1e293b;
    font-size: 0.95rem;
}

.user-cell small {
    margin-top: 0.2rem;
    color: #64748b;
}

.user-avatar {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #e2e8f0;
}

.avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1f5f9;
    color: #64748b;
}

.action-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
}

.user-form {
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

.checkbox-field {
    flex-direction: row;
    align-items: center;
    gap: 0.6rem;
    margin-top: 0.2rem;
}

/* Estilo moderno de Dropzone para imagens */
.dropzone-container {
    border: 2px dashed #cbd5e1;
    background-color: #f8fafc;
    padding: 1.5rem;
    border-radius: 12px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
}
.dropzone-container:hover {
    border-color: #2563eb;
    background-color: #f1f5f9;
}
.dropzone-content {
    display: flex;
    flex-direction: column;
    align-items: center;
}
.preview-container {
    display: flex;
    flex-direction: column;
    align-items: center;
}
.photo-preview-box {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #2563eb;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
.hidden-file-input {
    display: none;
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
    .filters-group {
        width: 100%;
        justify-content: space-between;
    }
    .filter-dropdown {
        width: 48%;
    }
}
</style>