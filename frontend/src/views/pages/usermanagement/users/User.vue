<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
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
import FileUpload from 'primevue/fileupload';
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

const fotoInput = ref(null);
const fotoPreview = ref('');

const form = reactive({
    id: null,
    nome_completo: '',
    email: '',
    username: '',
    password_hash: '',
    role_id: null,
    ativo: true,
    foto: null
});

/*
 * Normaliza respostas:
 * 1. Axios completo: { status: 200, data: {...} }
 * 2. Corpo da API: { success: true, data: [...] }
 * 3. Resposta directa: [...]
 */
function obterCorpo(resposta) {
    return resposta?.data ?? resposta;
}

/*
 * Considera sucesso:
 * - HTTP 2xx na resposta Axios;
 * - status HTTP exposto directamente;
 * - success: true no corpo da API.
 */
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

/*
 * Extrai listas de respostas com estruturas diferentes:
 * [...] ou { data: [...] } ou { data: { data: [...] } }
 */
function extrairLista(resposta) {
    const corpo = obterCorpo(resposta);

    if (Array.isArray(corpo)) {
        return corpo;
    }

    if (Array.isArray(corpo?.data)) {
        return corpo.data;
    }

    if (Array.isArray(corpo?.data?.data)) {
        return corpo.data.data;
    }

    if (Array.isArray(corpo?.users)) {
        return corpo.users;
    }

    if (Array.isArray(corpo?.utilizadores)) {
        return corpo.utilizadores;
    }

    return [];
}

const roleOptions = computed(() =>
    roles.value.map((role) => ({
        label: role.nome,
        value: role.id
    }))
);

const utilizadoresFiltrados = computed(() => {
    const termo = search.value.trim().toLowerCase();

    if (!termo) {
        return users.value;
    }

    return users.value.filter((user) => {
        return [
            user.nome_completo,
            user.email,
            user.username,
            user.role_nome,
            user.role?.nome
        ].some((valor) =>
            String(valor ?? '').toLowerCase().includes(termo)
        );
    });
});

function notificarSucesso(detail) {
    toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail,
        life: 4000
    });
}

function notificarErro(detail) {
    toast.add({
        severity: 'error',
        summary: 'Erro',
        detail,
        life: 5000
    });
}

function limparFormulario() {
    Object.assign(form, {
        id: null,
        nome_completo: '',
        email: '',
        username: '',
        password_hash: '',
        role_id: null,
        ativo: true,
        foto: null
    });

    fotoPreview.value = '';

    if (fotoInput.value) {
        fotoInput.value.value = '';
    }
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
        ativo: Boolean(
            user.ativo === true ||
            user.ativo === 1 ||
            user.ativo === '1'
        ),
        foto: null
    });

    fotoPreview.value = user.foto_url ?? user.foto ?? '';
    showForm.value = true;
}

function seleccionarFoto(event) {
    const ficheiro = event.target.files?.[0];

    if (!ficheiro) {
        return;
    }

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
    fd.append('ativo', form.ativo ? '1' : '0');

    if (form.password_hash) {
        fd.append('password_hash', form.password_hash);
    }

    if (form.foto instanceof File) {
        fd.append('foto', form.foto);
    }

    console.log('Fotografia a enviar:', form.foto);

    return fd;
}

async function carregar() {
    loading.value = true;

    try {
        const resposta = await usersApi.list();

        console.log('Resposta ao carregar utilizadores:', resposta);

        if (!operacaoBemSucedida(resposta)) {
            throw new Error(
                mensagemErro(
                    resposta,
                    'Não foi possível carregar os utilizadores.'
                )
            );
        }

        users.value = extrairLista(resposta);
    } catch (erro) {
        console.error('Erro ao carregar utilizadores:', erro);

        notificarErro(
            erro?.message ||
            'Ocorreu um erro ao carregar os utilizadores.'
        );
    } finally {
        loading.value = false;
    }
}

async function carregarRoles() {
    try {
        const resposta = await rolesApi.list();

        console.log('Resposta ao carregar perfis:', resposta);

        if (!operacaoBemSucedida(resposta)) {
            throw new Error(
                mensagemErro(
                    resposta,
                    'Não foi possível carregar os perfis.'
                )
            );
        }

        roles.value = extrairLista(resposta);
    } catch (erro) {
        console.error('Erro ao carregar perfis:', erro);

        notificarErro(
            erro?.message ||
            'Ocorreu um erro ao carregar os perfis.'
        );
    }
}

async function salvar() {
    if (
        !form.nome_completo.trim() ||
        !form.email.trim() ||
        !form.username.trim() ||
        !form.role_id
    ) {
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

        console.log('Resposta ao guardar utilizador:', resposta);

        if (operacaoBemSucedida(resposta)) {
            notificarSucesso(
                modoEdicao.value
                    ? 'Utilizador actualizado.'
                    : 'Utilizador criado.'
            );

            showForm.value = false;
            limparFormulario();

            await carregar();
        } else {
            notificarErro(
                mensagemErro(
                    resposta,
                    'A API não confirmou a operação.'
                )
            );
        }
    } catch (erro) {
        console.error('Erro ao guardar utilizador:', erro);

        notificarErro(
            mensagemErro(
                erro?.response ?? erro,
                erro?.message || 'Não foi possível guardar o utilizador.'
            )
        );
    } finally {
        saving.value = false;
    }
}

async function alterarEstado(user) {
    const estadoActual =
        user.ativo === true ||
        user.ativo === 1 ||
        user.ativo === '1';

        console.log(`estadoActual: ${estadoActual}`)

    const novoEstado = !estadoActual;

    try {
        const resposta = await usersApi.updateStatus(
            user.id,
            novoEstado
        );

        console.log('Resposta ao alterar estado:', resposta);

        if (operacaoBemSucedida(resposta)) {
            notificarSucesso(
                novoEstado
                    ? 'Utilizador activado.'
                    : 'Utilizador desactivado.'
            );

            await carregar();
        } else {
            notificarErro(
                mensagemErro(
                    resposta,
                    'Não foi possível alterar o estado do utilizador.'
                )
            );
        }
    } catch (erro) {
        console.error('Erro ao alterar estado:', erro);

        notificarErro(
            mensagemErro(
                erro?.response ?? erro,
                erro?.message || 'Falha ao alterar o estado.'
            )
        );
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

        console.log('Resposta ao remover utilizador:', resposta);

        if (operacaoBemSucedida(resposta)) {
            notificarSucesso('Utilizador removido.');

            await carregar();
        } else {
            notificarErro(
                mensagemErro(
                    resposta,
                    'Não foi possível remover o utilizador.'
                )
            );
        }
    } catch (erro) {
        console.error('Erro ao remover utilizador:', erro);

        notificarErro(
            mensagemErro(
                erro?.response ?? erro,
                erro?.message || 'Falha ao remover o utilizador.'
            )
        );
    }
}

onMounted(async () => {
    await Promise.all([
        carregar(),
        carregarRoles()
    ]);
});
</script>

<template>
    <Toast />
    <ConfirmDialog />

    <div class="utilizadores-page">
        <div class="page-header">
            <div>
                <h1>Gestão de utilizadores</h1>
                <p>Consulte e administre os utilizadores do sistema.</p>
            </div>

            <Button label="Novo utilizador" icon="pi pi-plus" @click="abrirCriacao" />
        </div>

        <div class="toolbar">
            <InputText v-model="search" placeholder="Pesquisar por nome, email ou perfil..." class="search-input" />

            <Button icon="pi pi-refresh" label="Actualizar" severity="secondary" outlined :loading="loading"
                @click="carregar" />
        </div>

        <DataTable :value="utilizadoresFiltrados" :loading="loading" dataKey="id" paginator :rows="10"
            :rowsPerPageOptions="[5, 10, 20, 50]" stripedRows responsiveLayout="scroll"
            emptyMessage="Nenhum utilizador encontrado.">
            <Column field="id" header="ID" sortable />

            <Column header="Utilizador" sortable sortField="nome_completo">
                <template #body="{ data }">
                    <div class="user-cell">
                        <img v-if="data.foto_url || data.foto" :src="`${API_URL}${data.foto_url || data.foto}`"
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

            <Column field="email" header="Email" sortable />

            <Column header="Perfil">
                <template #body="{ data }">
                    {{
                        data.role_nome ||
                        data.role?.nome ||
                        roles.find(r => r.id === data.role_id)?.nome ||
                        '—'
                    }}
                </template>
            </Column>

            <!-- <Column header="Estado">
                <template #body="{ data }">
                    <Tag
                        :value="
                            data.ativo === true ||
                            data.ativo === 1 ||
                            data.ativo === '1'
                                ? 'Activo'
                                : 'Inactivo'
                        "
                        :severity="
                            data.ativo === true ||
                            data.ativo === 1 ||
                            data.ativo === '1'
                                ? 'success'
                                : 'danger'
                        "
                    />
                </template>
            </Column> -->

            <!-- <Column header="Acções" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ console.log(data.estado) }}
                    <div class="action-buttons">
                        <Button icon="pi pi-pencil" severity="info" text rounded aria-label="Editar"
                            v-tooltip.top="'Editar utilizador'" @click="abrirEdicao(data)" />

                        <Button :icon="data.ativo === true ||
                                data.ativo === 1 ||
                                data.ativo === '1'
                                ? 'pi pi-lock'
                                : 'pi pi-lock-open'
                            " :severity="data.ativo === true ||
                                    data.ativo === 1 ||
                                    data.ativo === '1'
                                    ? 'warn'
                                    : 'success'
                                " text rounded aria-label="Alterar estado" @click="alterarEstado(data)" />

                        <Button icon="pi pi-trash" severity="danger" text rounded aria-label="Remover"
                            @click="confirmarRemocao(data)" />
                    </div>
                </template>
            </Column> -->
        </DataTable>

        <Dialog v-model:visible="showForm" :header="modoEdicao ? 'Editar utilizador' : 'Novo utilizador'" modal
            :style="{ width: 'min(95vw, 620px)' }" :closable="!saving">
            <form class="user-form" @submit.prevent="salvar">
                <div class="field">
                    <label for="nome_completo">Nome completo *</label>
                    <InputText id="nome_completo" v-model="form.nome_completo" required class="w-full"
                        autocomplete="name" />
                </div>

                <div class="field">
                    <label for="email">Email *</label>
                    <InputText id="email" v-model="form.email" type="email" required class="w-full"
                        autocomplete="email" />
                </div>

                <div class="field">
                    <label for="username">Nome de utilizador *</label>
                    <InputText id="username" v-model="form.username" required class="w-full" autocomplete="username" />
                </div>

                <div class="field">
                    <label for="password_hash">
                        Palavra-passe
                        {{ modoEdicao ? '(deixe vazio para manter)' : '*' }}
                    </label>

                    <Password id="password_hash" v-model="form.password_hash" :required="!modoEdicao"
                        :feedback="!modoEdicao" toggleMask class="w-full" inputClass="w-full"
                        autocomplete="new-password" />
                </div>

                <div class="field">
                    <label for="role_id">Perfil *</label>
                    <Dropdown id="role_id" v-model="form.role_id" :options="roleOptions" optionLabel="label"
                        optionValue="value" placeholder="Seleccione um perfil" class="w-full"
                        :loading="roles.length === 0" />
                </div>

                <div class="field">
                    <label for="foto">Fotografia</label>

                    <input id="foto" ref="fotoInput" type="file" accept="image/*" @change="seleccionarFoto" />

                    <img v-if="fotoPreview" :src="fotoPreview" alt="Pré-visualização da fotografia"
                        class="photo-preview" />
                </div>

                <div class="field checkbox-field">
                    <Checkbox v-model="form.ativo" inputId="ativo" binary />
                    <label for="ativo">Utilizador activo</label>
                </div>

                <div class="form-actions">
                    <Button type="button" label="Cancelar" severity="secondary" outlined :disabled="saving"
                        @click="showForm = false" />

                    <Button type="submit" :label="modoEdicao ? 'Guardar alterações' : 'Criar utilizador'"
                        icon="pi pi-check" :loading="saving" />
                </div>
            </form>
        </Dialog>
    </div>
</template>

<style scoped>
.utilizadores-page {
    padding: 1.5rem;
}

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.page-header h1 {
    margin: 0 0 0.4rem;
    font-size: 1.5rem;
}

.page-header p {
    margin: 0;
    color: var(--p-text-muted-color);
}

.toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
}

.search-input {
    width: min(100%, 420px);
}

.user-cell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.user-cell strong,
.user-cell small {
    display: block;
}

.user-cell small {
    margin-top: 0.2rem;
    color: var(--p-text-muted-color);
}

.user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
}

.avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--p-surface-100);
    color: var(--p-text-muted-color);
}

.action-buttons {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.user-form {
    display: grid;
    gap: 1rem;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
}

.field label {
    font-weight: 500;
}

.w-full {
    width: 100%;
}

.checkbox-field {
    flex-direction: row;
    align-items: center;
}

.photo-preview {
    width: 100px;
    height: 100px;
    border-radius: 8px;
    object-fit: cover;
    margin-top: 0.5rem;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 0.75rem;
}

@media (max-width: 640px) {
    .utilizadores-page {
        padding: 1rem;
    }

    .page-header,
    .toolbar {
        align-items: stretch;
        flex-direction: column;
    }

    .search-input {
        width: 100%;
    }
}
</style>
