<script setup>
import { ref, reactive, onMounted } from 'vue';
import { cursoService } from '@/services/cursoService';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const cursos = ref([]);
const loading = ref(false);
const error = ref(null);

const form = reactive({ id: null, nome: '', codigo: '', descricao: '', ativo: true });
const showForm = ref(false);
const modoEdicao = ref(false);

onMounted(listar);

async function listar() {
    loading.value = true;
    try {
        const resposta = await cursoService.listar({});
        cursos.value = resposta.data || resposta;
    } catch (err) {
        error.value = err.message || 'Erro ao listar cursos.';
        toast.add({ severity: 'error', summary: 'Erro', detail: error.value });
    } finally {
        loading.value = false;
    }
}

function abrirNovo() {
    Object.assign(form, { id: null, nome: '', codigo: '', descricao: '', ativo: true });
    modoEdicao.value = false;
    showForm.value = true;
}

function editar(item) {
    Object.assign(form, {
        id: item.id,
        nome: item.nome,
        codigo: item.codigo,
        descricao: item.descricao || '',
        ativo: item.ativo === 1 || item.ativo === true
    });
    modoEdicao.value = true;
    showForm.value = true;
}

async function salvar() {
    if (!form.nome || !form.codigo) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Nome e código são obrigatórios.' });
        return;
    }
    try {
        const resposta = modoEdicao.value
            ? await cursoService.actualizar(form.id, { nome: form.nome, codigo: form.codigo, descricao: form.descricao, ativo: form.ativo })
            : await cursoService.criar({ nome: form.nome, codigo: form.codigo, descricao: form.descricao, ativo: form.ativo });
        if (resposta.success) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: modoEdicao.value ? 'Curso actualizado.' : 'Curso criado.' });
            showForm.value = false;
            await listar();
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: resposta.error });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Erro ao guardar curso.' });
    }
}

async function remover(id) {
    if (!window.confirm('Tem certeza que deseja eliminar este curso?')) return;
    try {
        const resposta = await cursoService.eliminar(id);
        if (resposta.success) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Curso eliminado.' });
            await listar();
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: resposta.error });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Erro ao eliminar curso.' });
    }
}

</script>

<template>
    <div class="crud-page">
        <Toast />
        <div class="page-header">
            <h1 class="text-2xl font-bold">Gestão de Cursos</h1>
            <p class="text-sias-text-secondary">Cadastre os cursos da instituição.</p>
        </div>

        <div class="toolbar">
            <Button label="Novo Curso" icon="pi pi-plus" outlined @click="abrirNovo" />
        </div>

        <Card class="mt-4">
            <DataTable :value="cursos" :paginator="true" :rows="10" dataKey="id" :loading="loading" emptyMessage="Nenhum curso encontrado.">
                <template #header>
                    <span>Cursos ({{ cursos.value.length }})</span>
                </template>
                <Column field="nome" header="Nome" sortable />
                <Column field="codigo" header="Código" sortable />
                <Column field="descricao" header="Descrição" />
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

        <Dialog v-model:visible="showForm" :header="modoEdicao ? 'Editar Curso' : 'Novo Curso'" :modal="true" style="width: 500px">
            <div class="flex flex-col gap-3">
                <InputText v-model="form.nome" label="Nome" placeholder="Ex: Engenharia Informática" />
                <InputText v-model="form.codigo" label="Código" placeholder="Ex: ENG-INF" />
                <Textarea v-model="form.descricao" label="Descrição" :rows="2" placeholder="Descrição do curso" />
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
