<script setup>
import { ref, reactive, onMounted } from 'vue';
import { usersApi } from '@/api/users';
import { rolesApi } from '@/api/roles';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const users = ref([]);
const roles = ref([]);
const loading = ref(false);
const error = ref(null);
const search = ref('');

const form = reactive({ id: null, nome_completo: '', email: '', username: '', password_hash: '', role_id: '', ativo: true, foto: null });
const showForm = ref(false);
const modoEdicao = ref(false);

onMounted(async () => {
    await carregar();
    await carregarRoles();
});

async function carregar() {
    loading.value = true;
    try {
        const resposta = await usersApi.list({ search: search.value });
        users.value = resposta.data || resposta;
    } catch (err) {
        error.value = err.message || 'Erro ao listar utilizadores.';
        toast.add({ severity: 'error', summary: 'Erro', detail: error.value });
    } finally {
        loading.value = false;
    }
}

async function carregarRoles() {
    try {
        const resposta = await rolesApi.list();
        roles.value = Array.isArray(resposta.data) ? resposta.data : (Array.isArray(resposta) ? resposta : []);
    } catch (err) {
        console.error('Erro ao carregar roles:', err);
        roles.value = [];
    }
}

function abrirNovo() {
    Object.assign(form, { id: null, nome_completo: '', email: '', username: '', password_hash: '', role_id: '', ativo: true, foto: null });
    modoEdicao.value = false;
    showForm.value = true;
}

function editar(item) {
    Object.assign(form, {
        id: item.id,
        nome_completo: item.nome_completo,
        email: item.email,
        username: item.username,
        role_id: item.role_id,
        ativo: item.estado === 1 || item.estado === true,
        password_hash: '',
        foto: item.foto || null
    });
    modoEdicao.value = true;
    showForm.value = true;
}

const onFotoChange = (event) => {
    const files = event.target.files || event.files;
    if (files && files.length > 0) {
        form.foto = files[0];
    }
};

async function salvar() {
    if (!form.nome_completo || !form.email || !form.username || !form.role_id) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha todos os campos obrigatórios.' });
        return;
    }
    if (!modoEdicao.value && !form.password_hash) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'A palavra-passe é obrigatória.' });
        return;
    }

    const fd = new FormData();
    fd.append('nome_completo', form.nome_completo);
    fd.append('email', form.email);
    fd.append('username', form.username);
    fd.append('role_id', form.role_id);
    fd.append('ativo', form.ativo ? '1' : '0');
    if (form.password_hash) fd.append('password_hash', form.password_hash);
    if (form.foto) fd.append('foto', form.foto);

    try {
        const resposta = modoEdicao.value
            ? await usersApi.update(fd, form.id)
            : await usersApi.create(fd);
        if (resposta.success) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: modoEdicao.value ? 'Utilizador actualizado.' : 'Utilizador criado.' });
            showForm.value = false;
            await carregar();
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: resposta.error });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Erro ao guardar utilizador.' });
    }
}

async function alterarEstado(id, novoEstado) {
    try {
        const resposta = await usersApi.updateStatus(id, novoEstado);
        if (resposta.success) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Estado actualizado.' });
            await carregar();
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: resposta.error });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Erro ao alterar estado.' });
    }
}

async function remover(id) {
    if (!window.confirm('Eliminar este utilizador?')) return;
    try {
        const resposta = await usersApi.remove(id);
        if (resposta.success) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Utilizador eliminado.' });
            await carregar();
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: resposta.error });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Erro ao eliminar utilizador.' });
    }
}

</script>

<template>
    <div class="crud-page">
        <Toast />
        <div class="page-header">
            <h1 class="text-2xl font-bold">Gestão de Utilizadores</h1>
            <p class="text-sias-text-secondary">Registe e gerencie os utilizadores do sistema.</p>
        </div>

        <div class="toolbar">
            <InputText v-model="search.value" placeholder="Pesquisar por nome, email ou username" />
            <Button label="Novo Utilizador" icon="pi pi-plus" outlined @click="abrirNovo" />
        </div>

        <Card class="mt-4">
            <DataTable :value="users" :paginator="true" :rows="10" dataKey="id" :loading="loading" emptyMessage="Nenhum utilizador encontrado.">
                <template #header>
                    <span>Utilizadores ({{ users.value.length }})</span>
                </template>
                <Column field="nome_completo" header="Nome Completo" sortable />
                <Column field="email" header="Email" sortable />
                <Column field="username" header="Username" sortable />
                <Column field="role_nome" header="Perfil" />
                <Column field="foto" header="Foto">
                    <template #body="slotProps">
                        <img v-if="slotProps.data.foto" :src="slotProps.data.foto" class="foto-thumb" />
                        <span v-else class="sem-foto">Sem foto</span>
                    </template>
                </Column>
                <Column field="estado" header="Estado">
                    <template #body="slotProps">
                        <Button
                            :icon="slotProps.data.estado === 1 ? 'pi pi-toggle-on' : 'pi pi-toggle-off'"
                            :class="slotProps.data.estado === 1 ? 'btn-active' : 'btn-inactive'"
                            :label="slotProps.data.estado === 1 ? 'Activo' : 'Inactivo'"
                            outlined
                            rounded
                            size="small"
                            @click="alterarEstado(slotProps.data.id, slotProps.data.estado === 1 ? 0 : 1)"
                        />
                    </template>
                </Column>
                <Column field="acoes" header="Ações" style="width: 220px; text-align: center">
                    <template #body="slotProps">
                        <div class="flex justify-content-center gap-2">
                            <Button icon="pi pi-pencil" outlined rounded class="btn-edit" @click="editar(slotProps.data)" />
                            <Button icon="pi pi-trash" outlined severity="danger" rounded class="btn-delete" @click="remover(slotProps.data.id)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </Card>

        <Dialog v-model:visible="showForm" :header="modoEdicao ? 'Editar Utilizador' : 'Novo Utilizador'" :modal="true" style="width: 600px">
            <div class="flex flex-col gap-3">
                <InputText v-model="form.nome_completo" label="Nome Completo" placeholder="Nome completo" />
                <InputText v-model="form.email" label="Email" type="email" placeholder="email@exemplo.com" />
                <InputText v-model="form.username" label="Username" placeholder="Nome de utilizador" />
                <InputText v-model="form.password_hash" label="Palavra-passe" type="password" :placeholder="modoEdicao ? 'Deixe vazio para manter' : 'Nova palavra-passe'" />
                <Dropdown v-model="form.role_id" label="Perfil" :options="roles.map(r => ({ label: r.nome, value: r.id }))" placeholder="Selecionar perfil" />
                <div class="file-upload-field">
                    <label class="file-upload-label">
                        <InputFile v-on:change="onFotoChange" />
                        <span>{{ form.foto ? form.foto.name : 'Selecionar foto de perfil' }}</span>
                    </label>
                </div>
                <div class="field-checkbox">
                    <InputSwitch v-model="form.ativo" inputId="ativo" />
                    <label for="ativo">Activo</label>
                </div>
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
.btn-active {
    color: var(--sias-dusk-blue) !important;
}
.btn-inactive {
    color: var(--sias-blue-slate) !important;
}
.foto-thumb {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid var(--sias-border);
}
.sem-foto {
    font-size: 0.75rem;
    color: var(--sias-text-muted);
}
.file-upload-field {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.file-upload-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: 1px solid var(--sias-border);
    border-radius: 6px;
    background: var(--sias-surface);
    cursor: pointer;
    font-size: 0.9rem;
    color: var(--sias-text-primary);
}
.file-upload-label input[type="file"] {
    display: none;
}
.field-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.crud-page {
    color: var(--sias-text-primary);
}
</style>
