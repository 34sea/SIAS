<script setup>
import { ref, reactive, onMounted } from 'vue';
import { estudanteService } from '@/services/estudanteService';
import { cursoService } from '@/services/cursoService';
import { usersApi } from '@/api/users';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const estudantes = ref([]);
const cursos = ref([]);
const utilizadores = ref([]);
const loading = ref(false);
const error = ref(null);

const form = reactive({ id: null, utilizador_id: '', curso_id: '', numero_estudante: '', ano_ingresso: '', ativo: true });
const showForm = ref(false);
const modoEdicao = ref(false);

onMounted(async () => {
    loading.value = true;
    try {
        await Promise.all([
            estudanteService.listar({}),
            cursoService.listar({}),
            carregarUtilizadores()
        ]);
    } catch (err) {
        error.value = err.message || 'Erro ao listar estudantes.';
        toast.add({ severity: 'error', summary: 'Erro', detail: error.value });
    } finally {
        loading.value = false;
    }
});

async function carregarUtilizadores() {
    try {
        const resposta = await usersApi.list({ role_id: '' });
        const data = Array.isArray(resposta.data) ? resposta.data : (Array.isArray(resposta) ? resposta : []);
        // Filtrar apenas utilizadores que ainda não são estudantes nem docentes
        utilizadores.value = data.filter(u => u.role_nome !== 'ESTUDANTE' && u.role_nome !== 'DOCENTE');
    } catch (err) {
        console.error('Erro ao carregar utilizadores:', err);
        utilizadores.value = [];
    }
}

function abrirNovo() {
    Object.assign(form, { id: null, utilizador_id: '', curso_id: '', numero_estudante: '', ano_ingresso: '', ativo: true });
    modoEdicao.value = false;
    showForm.value = true;
}

function editar(item) {
    Object.assign(form, {
        id: item.id,
        utilizador_id: item.utilizador_id,
        curso_id: item.curso_id,
        numero_estudante: item.numero_estudante || '',
        ano_ingresso: item.ano_ingresso || '',
        ativo: item.ativo === 1 || item.ativo === true
    });
    modoEdicao.value = true;
    showForm.value = true;
}

async function salvar() {
    if (!form.utilizador_id || !form.curso_id) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Utilizador e curso são obrigatórios.' });
        return;
    }
    try {
        const resposta = modoEdicao.value
            ? await estudanteService.actualizar(form.id, { curso_id: form.curso_id, numero_estudante: form.numero_estudante, ano_ingresso: form.ano_ingresso, ativo: form.ativo })
            : await estudanteService.criar({ utilizador_id: form.utilizador_id, curso_id: form.curso_id, numero_estudante: form.numero_estudante, ano_ingresso: form.ano_ingresso, ativo: form.ativo });
        if (resposta.success) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: modoEdicao.value ? 'Estudante actualizado.' : 'Estudante registado.' });
            showForm.value = false;
            const resposta2 = await estudanteService.listar({});
            estudantes.value = resposta2.data || resposta2;
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: resposta.error });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Erro ao guardar estudante.' });
    }
}

async function remover(id) {
    if (!window.confirm('Eliminar este estudante?')) return;
    try {
        const resposta = await estudanteService.eliminar(id);
        if (resposta.success) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Estudante eliminado.' });
            const resposta2 = await estudanteService.listar({});
            estudantes.value = resposta2.data || resposta2;
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: resposta.error });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Erro ao eliminar estudante.' });
    }
}

</script>

<template>
    <div class="crud-page">
        <Toast />
        <div class="page-header">
            <h1 class="text-2xl font-bold text-sias-800">Gestão de Estudantes</h1>
            <p class="text-sias-600">Registe os estudantes que submetem monografias.</p>
        </div>

        <div class="toolbar">
            <Button label="Novo Estudante" icon="pi pi-plus" outlined @click="abrirNovo" />
        </div>

        <Card class="mt-4">
            <DataTable :value="estudantes" :paginator="true" :rows="10" dataKey="id" :loading="loading" emptyMessage="Nenhum estudante encontrado.">
                <template #header>
                    <span>Estudantes ({{ estudantes.value.length }})</span>
                </template>
                <Column field="nome_completo" header="Nome Completo" sortable />
                <Column field="email" header="Email" sortable />
                <Column field="curso_nome" header="Curso" sortable />
                <Column field="numero_estudante" header="Nº Estudante" />
                <Column field="ano_ingresso" header="Ano Ingresso" />
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

        <Dialog v-model:visible="showForm" :header="modoEdicao ? 'Editar Estudante' : 'Novo Estudante'" :modal="true" style="width: 550px">
            <div class="flex flex-col gap-3">
                <Dropdown v-model="form.utilizador_id" label="Utilizador do Sistema" :options="utilizadores.map(u => ({ label: u.nome_completo + ' (' + u.email + ')', value: u.id }))" placeholder="Selecionar utilizador" />
                <Dropdown v-model="form.curso_id" label="Curso" :options="Array.isArray(cursos) ? cursos.map(c => ({ label: c.nome, value: c.id })) : []" placeholder="Selecionar curso" />
                <InputText v-model="form.numero_estudante" label="Nº Estudante" />
                <InputText v-model="form.ano_ingresso" label="Ano de Ingresso" type="number" />
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
    background: #d4edda;
    color: #155724;
    font-size: 0.8rem;
    font-weight: 600;
}
.badge-inativo {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    background: #f8d7da;
    color: #721c24;
    font-size: 0.8rem;
    font-weight: 600;
}
.field-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
</style>
