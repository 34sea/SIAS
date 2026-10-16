<script setup>
import { ref, reactive, onMounted } from 'vue';
import { cursoService } from '@/services/cursoService';
import { useAuth } from '@/composables/useAuth';
import { useToast } from 'primevue/usetoast';

const { role } = useAuth();
const toast = useToast();

const cursos = ref([]);
const loading = ref(false);
const error = ref(null);

const form = reactive({ id: null, nome: '', codigo: '', descricao: '', ativo: true });
const showForm = ref(false);
const modoEdicao = ref(false);

onMounted(async () => {
    try {
        const resposta = await cursoService.listar({});
        cursos.value = resposta.data || resposta;
        console.log("Resposta")
        console.log(resposta.data)
        console.log("------------------------------------")
        console.log(cursos.value)
    } catch (err) {
        error.value = err.message || 'Erro ao listar cursos.';
        toast.add({ severity: 'error', summary: 'Erro', detail: error.value });
    } finally {
        loading.value = false;
    }
});

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
            const resposta2 = await cursoService.listar({});
            cursos.value = resposta2.data || resposta2;
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: resposta.error });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Erro ao guardar curso.' });
    }
}

async function remover(id) {
    if (!window.confirm('Eliminar este curso?')) return;
    try {
        const resposta = await cursoService.eliminar(id);
        if (resposta.success) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Curso eliminado.' });
            const resposta2 = await cursoService.listar({});
            cursos.value = resposta2.data || resposta2;
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: resposta.error });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Erro ao eliminar curso.' });
    }
}

const podeGerir = role.value === 'ADMIN';

</script>

<template>
    <div class="crud-page">
        <Toast />
        <div class="page-header">
            <h1 class="text-2xl font-bold text-sias-800">Gestão de Cursos</h1>
            <p class="text-sias-600">Cadastre os cursos da instituição.</p>
        </div>

        <div class="toolbar">
            <Button v-if="podeGerir" label="Novo Curso" icon="pi pi-plus" outlined @click="abrirNovo" />
        </div>

        <Card style="border: 0px solid transparent; padding: 20px;">
            <template #content>
  

                 <DataTable :value="cursos" :paginator="true" :rows="10" dataKey="id" :loading="loading"
                emptyMessage="Nenhum curso encontrado.">
                <template #header>
                    <span>Cursos ({{ cursos.length }})</span>
                </template>

                <Column field="nome" header="Nome" sortable />
                <Column field="codigo" header="Código" sortable />
                <Column field="descricao" header="Descrição" />

                <Column field="ativo" header="Estado">
                    <template #body="slotProps">
                        <span :class="Number(slotProps.data.ativo) === 1
                            ? 'badge-ativo'
                            : 'badge-inativo'">
                            {{ Number(slotProps.data.ativo) === 1
                                ? 'Activo'
                                : 'Inactivo' }}
                        </span>
                    </template>
                </Column>

                <Column field="acoes" header="Ações">
                    <template #body="slotProps">
                        <div class="flex justify-content-center gap-2">
                            <Button v-if="podeGerir" icon="pi pi-pencil" outlined rounded class="btn-edit"
                                @click="editar(slotProps.data)" />

                            <Button v-if="podeGerir" icon="pi pi-trash" outlined severity="danger" rounded
                                class="btn-delete" @click="remover(slotProps.data.id)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
            </template>
            
        </Card>
        <Dialog v-model:visible="showForm" :header="modoEdicao ? 'Editar Curso' : 'Novo Curso'" :modal="true"
            style="width: 500px">
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
