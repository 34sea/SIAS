<script setup>
import { ref, reactive, onMounted } from 'vue';
import { documentoComparacaoService } from '@/services/documentoComparacaoService';
import { cursoService } from '@/services/cursoService';
import { useToast } from 'primevue/usetoast';

const { listar, criar, actualizar, eliminar, items, loading, error } = documentoComparacaoService;
const toast = useToast();

const cursos = ref([]);
const form = reactive({
    id: null,
    titulo: '',
    autor: '',
    ano: null,
    curso_id: '',
    ficheiro: null,
    hash_sha256: '',
    texto_extraido: '',
    texto_processado: '',
    ativo: true,
    excluir_da_comparacao: false,
    motivo_exclusao: '',
    criado_por: ''
});
const showForm = ref(false);
const modoEdicao = ref(false);

onMounted(async () => {
    await listar({});
    await carregarCursos();
});

async function carregarCursos() {
    try {
        const resposta = await cursoService.listar({});
        cursos.value = resposta.data || resposta;
    } catch (err) {
        console.error(err);
    }
}

const onFicheiroChange = (event) => {
    const files = event.target.files || event.files;
    if (files && files.length > 0) {
        form.ficheiro = files[0];
    }
};

function abrirNovo() {
    Object.assign(form, {
        id: null, titulo: '', autor: '', ano: null, curso_id: '',
        ficheiro: null, hash_sha256: '', texto_extraido: '', texto_processado: '',
        ativo: true, excluir_da_comparacao: false, motivo_exclusao: '', criado_por: ''
    });
    modoEdicao.value = false;
    showForm.value = true;
}

function editar(item) {
    Object.assign(form, { ...item, ativo: item.ativo === 1 || item.ativo === true, excluir_da_comparacao: item.excluir_da_comparacao === 1 || item.excluir_da_comparacao === true });
    modoEdicao.value = true;
    showForm.value = true;
}

async function salvar() {
    if (!form.titulo) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'O título é obrigatório.' });
        return;
    }

    const fd = new FormData();
    fd.append('titulo', form.titulo);
    fd.append('autor', form.autor || '');
    fd.append('ano', form.ano || '');
    fd.append('curso_id', form.curso_id || '');
    fd.append('nome_ficheiro', form.nome_ficheiro || '');
    fd.append('caminho_ficheiro', form.caminho_ficheiro || '');
    fd.append('hash_sha256', form.hash_sha256 || '');
    fd.append('texto_extraido', form.texto_extraido || '');
    fd.append('texto_processado', form.texto_processado || '');
    fd.append('ativo', form.ativo ? '1' : '0');
    fd.append('excluir_da_comparacao', form.excluir_da_comparacao ? '1' : '0');
    fd.append('motivo_exclusao', form.motivo_exclusao || '');
    fd.append('criado_por', form.criado_por || '');
    if (form.ficheiro) fd.append('ficheiro', form.ficheiro);

    try {
        const resposta = modoEdicao.value
            ? await actualizar(form.id, fd)
            : await criar(fd);
        if (resposta.success) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: modoEdicao.value ? 'Documento actualizado.' : 'Documento criado.' });
            showForm.value = false;
            await listar({});
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: resposta.error });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Erro ao guardar documento.' });
    }
}

async function remover(id) {
    if (!window.confirm('Eliminar este documento?')) return;
    try {
        const resposta = await eliminar(id);
        if (resposta.success) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Documento eliminado.' });
            await listar({});
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: resposta.error });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message || 'Erro ao eliminar documento.' });
    }
}

</script>

<template>
    <div class="crud-page">
        <Toast />
        <div class="page-header">
            <h1 class="text-2xl font-bold text-sias-800">Base Documental de Comparação</h1>
            <p class="text-sias-600">Gerencie os documentos usados para comparação de similaridade.</p>
        </div>

        <div class="toolbar">
            <Button label="Novo Documento" icon="pi pi-plus" outlined @click="abrirNovo" />
        </div>

        <Card class="mt-4">
            <DataTable :value="items" :paginator="true" :rows="10" dataKey="id" :loading="loading" emptyMessage="Nenhum documento encontrado.">
                <template #header>
                    <span>Documentos de Comparação ({{ items.value.length }})</span>
                </template>
                <Column field="titulo" header="Título" sortable />
                <Column field="autor" header="Autor" />
                <Column field="ano" header="Ano" />
                <Column field="curso_nome" header="Curso" />
                <Column field="nome_ficheiro" header="Ficheiro" />
                <Column field="ativo" header="Activo">
                    <template #body="slotProps">
                        <span :class="slotProps.data.ativo ? 'badge-ativo' : 'badge-inativo'">
                            {{ slotProps.data.ativo ? 'Sim' : 'Não' }}
                        </span>
                    </template>
                </Column>
                <Column field="excluir_da_comparacao" header="Excluída da Comparação">
                    <template #body="slotProps">
                        <span :class="slotProps.data.excluir_da_comparacao ? 'badge-excluido' : 'badge-normal'">
                            {{ slotProps.data.excluir_da_comparacao ? 'Sim' : 'Não' }}
                        </span>
                    </template>
                </Column>
                <Column field="acoes" header="Ações" style="width: 200px; text-align: center">
                    <template #body="slotProps">
                        <div class="flex justify-content-center gap-2">
                            <Button icon="pi pi-pencil" outlined rounded @click="editar(slotProps.data)" />
                            <Button icon="pi pi-trash" outlined severity="danger" rounded @click="remover(slotProps.data.id)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </Card>

        <Dialog v-model:visible="showForm" :header="modoEdicao ? 'Editar Documento' : 'Novo Documento'" :modal="true" style="width: 700px">
            <div class="flex flex-col gap-3">
                <InputText v-model="form.titulo" label="Título" placeholder="Título do documento" />
                <InputText v-model="form.autor" label="Autor" />
                <InputNumber v-model="form.ano" label="Ano" :min="1900" :max="2100" />
                <Dropdown v-model="form.curso_id" label="Curso" :options="Array.isArray(cursos) ? cursos.map(c => ({ label: c.nome, value: c.id })) : []" placeholder="Selecionar curso" />
                <div class="file-upload-field">
                    <label class="file-upload-label">
                        <InputFile v-on:change="onFicheiroChange" accept=".pdf,.doc,.docx" />
                        <span>{{ form.ficheiro ? form.ficheiro.name : 'Selecionar ficheiro (PDF ou Word)' }}</span>
                    </label>
                </div>
                <InputText v-model="form.hash_sha256" label="Hash SHA-256" placeholder="Hash do ficheiro (opcional)" />
                <div class="field-checkbox">
                    <InputSwitch v-model="form.ativo" inputId="ativo" />
                    <label for="ativo">Activo</label>
                </div>
                <div class="field-checkbox">
                    <InputSwitch v-model="form.excluir_da_comparacao" inputId="excluir" />
                    <label for="excluir">Excluir da comparação</label>
                </div>
                <InputText v-model="form.motivo_exclusao" label="Motivo de Exclusão" />
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
.badge-excluido {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    background: #f8d7da;
    color: #721c24;
    font-size: 0.8rem;
    font-weight: 600;
}
.badge-normal {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    background: #d4edda;
    color: #155724;
    font-size: 0.8rem;
    font-weight: 600;
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
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--surface-section);
    cursor: pointer;
    font-size: 0.9rem;
    color: var(--text-color);
}
.file-upload-label input[type="file"] {
    display: none;
}
.field-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
</style>
