<script setup>
import { ref, reactive, onMounted } from 'vue';
import { docenteService } from '@/services/docenteService';
import { usersApi } from '@/api/users';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const docentes = ref([]);
const utilizadores = ref([]);
const loading = ref(false);
const error = ref(null);

const form = reactive({ id: null, utilizador_id: '', departamento: '', especialidade: '', grau_academico: '', numero_funcionario: '', ativo: true });
const showForm = ref(false);
const modoEdicao = ref(false);

onMounted(async () => {
    loading.value = true;
    try {
        await Promise.all([
            docenteService.listar({}),
            carregarUtilizadores()
        ]);
    } catch (err) {
        error.value = err.message || 'Erro ao listar docentes.';
        toast.add({ severity: 'error', summary: 'Erro', detail: error.value });
    } finally {
        loading.value = false;
    }
});

async function carregarUtilizadores() {
    try {
        const resposta = await usersApi.list({ role_id: '' });
        const data = Array.isArray(resposta.data) ? resposta.data : (Array.isArray(resposta) ? resposta : []);
        utilizadores.value = data.filter(u => u.role_nome !== 'DOCENTE' && u.role_nome !== 'ESTUDANTE');
    } catch (err) {
        console.error('Erro ao carregar utilizadores:', err);
        utilizadores.value = [];
    }
}

function abrirNovo() {
    Object.assign(form, { id: null, utilizador_id: '', departamento: '', especialidade: '', grau_academico: '', numero_funcionario: '', ativo: true });
    modoEdicao.value = false;
    showForm.value = true;
}

function editar(item) {
    Object.assign(form, {
        id: item.id,
        utilizador_id: item.utilizador_id,
        departamento: item.departamento || '',
        especialidade: item.especialidade || '',
        grau_academico: item.grau_academico || '',
        numero_funcionario: item.numero_funcionario || '',
        ativo: item.ativo === 1 || item.ativo === true
    });
    modoEdicao.value = true;
    showForm.value = true;
}

async function salvar() {
    if (!form.utilizador_id) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'O utilizador é obrigatório.' });
        return;
    }
    try {
        const resposta = modoEdicao.value
            ? await docenteService.actualizar(form.id, {
                departamento: form.departamento,
                especialidade: form.especialidade,
                grau_academico: form.grau_academico,
                numero_funcionario: form.numero_funcionario,
                ativo: form.ativo
            })
            : await docenteService.criar({
                utilizador_id: form.utilizador_id,
                departamento: form.departamento,
                especialidade: form.especialidade,
                grau_academico: form.grau_academico,
                numero_funcionario: form.numero_funcionario,
                ativo: form.ativo
            });
        if (resposta.success) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: modoEdicao.value ? 'Docente actualizado.' : 'Docente registado.' });
            showForm.value = false;
            const resposta2 = await docenteService.listar({});
            docentes.value = resposta2.data || resposta2;
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: resposta.error });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Erro ao guardar docente.' });
    }
}

async function remover(id) {
    if (!window.confirm('Eliminar este docente?')) return;
    try {
        const resposta = await docenteService.eliminar(id);
        if (resposta.success) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Docente eliminado.' });
            const resposta2 = await docenteService.listar({});
            docentes.value = resposta2.data || resposta2;
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: resposta.error });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Erro ao eliminar docente.' });
    }
}

</script>

<template>
    <div class="crud-page">
        <Toast />
        <div class="page-header">
            <h1 class="text-2xl font-bold">Gestão de Docentes / Orientadores</h1>
            <p class="text-sias-text-secondary">Registe os docentes que podem orientar monografias.</p>
        </div>

        <div class="toolbar">
            <Button label="Novo Docente" icon="pi pi-plus" outlined @click="abrirNovo" />
        </div>

        <Card class="mt-4">
            <DataTable :value="docentes" :paginator="true" :rows="10" dataKey="id" :loading="loading" emptyMessage="Nenhum docente encontrado.">
                <template #header>
                    <span>Docentes ({{ docentes.value.length }})</span>
                </template>
                <Column field="nome_completo" header="Nome Completo" sortable />
                <Column field="email" header="Email" sortable />
                <Column field="especialidade" header="Especialidade" />
                <Column field="grau_academico" header="Grau Académico" />
                <Column field="numero_funcionario" header="Nº Funcionário" />
                <Column field="ativo" header="Estado">
                    <template #body="slotProps">
                        <span :class="slotProps.data.ativo ? 'badge-ativo' : 'badge-inativo'">
                            {{ slotProps.data.ativo ? 'Activo' : 'Inactivo' }}
                        </span>
                    </template>
                </Column>
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

        <Dialog v-model:visible="showForm" :header="modoEdicao ? 'Editar Docente' : 'Novo Docente'" :modal="true" style="width: 550px">
            <div class="flex flex-col gap-3">
                <Dropdown v-model="form.utilizador_id" label="Utilizador do Sistema" :options="utilizadores.map(u => ({ label: u.nome_completo + ' (' + u.email + ')', value: u.id }))" placeholder="Selecionar utilizador" />
                <InputText v-model="form.departamento" label="Departamento" />
                <InputText v-model="form.especialidade" label="Especialidade" />
                <InputText v-model="form.grau_academico" label="Grau Académico" />
                <InputText v-model="form.numero_funcionario" label="Nº Funcionário" />
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
}
.badge-ativo {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    background: var(--sias-dusk-blue);
    color: var(--sias-text-primary);
    font-size: 0.8rem;
    font-weight: 600;
}
.badge-inativo {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    background: var(--sias-blue-slate);
    color: var(--sias-text-primary);
    font-size: 0.8rem;
    font-weight: 600;
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
