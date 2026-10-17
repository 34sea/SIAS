<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { documentoComparacaoService } from '@/services/documentoComparacaoService';
import { cursoService } from '@/services/cursoService';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';
import FileUpload from 'primevue/fileupload';
import ToggleSwitch from 'primevue/toggleswitch';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';

const { listar, criar, actualizar, eliminar } = documentoComparacaoService;
const toast = useToast();
const confirm = useConfirm();

// Estados locais reativos
const items = ref([]);
const total = ref(0);
const loading = ref(false);
const saving = ref(false);
const error = ref(null);

const search = ref('');
const cursoFiltro = ref('');
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

/* Normalizadores e Utilitários */
function extrairLista(resposta) {
    const corpo = resposta?.data ?? resposta;
    if (Array.isArray(corpo)) return corpo;
    if (Array.isArray(corpo?.data)) return corpo.data;
    if (Array.isArray(corpo?.documentos)) return corpo.documentos;
    return [];
}

function operacaoBemSucedida(resposta) {
    const status = Number(resposta?.status ?? resposta?.statusCode ?? resposta?.data?.status);
    return (status >= 200 && status < 300) || resposta?.success === true;
}

function mensagemErro(resposta, alternativa) {
    const corpo = resposta?.data ?? resposta;
    return corpo?.error || corpo?.message || resposta?.message || alternativa;
}

// Estatísticas Computadas
const totalDocumentos = computed(() => items.value.length);
const ativosDocumentos = computed(() => items.value.filter(d => d.ativo === 1 || d.ativo === true).length);
const excluidosDocumentos = computed(() => items.value.filter(d => d.excluir_da_comparacao === 1 || d.excluir_da_comparacao === true).length);

const documentosFiltrados = computed(() => {
    const termo = search.value.trim().toLowerCase();
    return items.value.filter((d) => {
        const matchBusca = !termo || [
            d.titulo,
            d.autor,
            d.nome_ficheiro,
            d.curso_nome
        ].some(v => String(v ?? '').toLowerCase().includes(termo));

        const matchCurso = !cursoFiltro.value || String(d.curso_id) === String(cursoFiltro.value);
        return matchBusca && matchCurso;
    });
});

onMounted(async () => {
    await carregarDados();
    await carregarCursos();
});

async function carregarDados() {
    loading.value = true;
    error.value = null;
    try {
        const resposta = await listar({});
        items.value = extrairLista(resposta);
    } catch (err) {
        error.value = err.message || 'Erro ao carregar documentos.';
        toast.add({ severity: 'error', summary: 'Erro', detail: error.value, life: 5000 });
    } finally {
        loading.value = false;
    }
}

async function carregarCursos() {
    try {
        const resposta = await cursoService.listar({});
        cursos.value = extrairLista(resposta);
    } catch (err) {
        console.error(err);
    }
}

function abrirNovo() {
    Object.assign(form, {
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
    modoEdicao.value = false;
    showForm.value = true;
}

function editar(item) {
    Object.assign(form, {
        ...item,
        ativo: item.ativo === 1 || item.ativo === true,
        excluir_da_comparacao: item.excluir_da_comparacao === 1 || item.excluir_da_comparacao === true
    });
    modoEdicao.value = true;
    showForm.value = true;
}

function onFicheiroChange(event) {
    const ficheiro = event.files?.[0] || event.target?.files?.[0];
    if (ficheiro) {
        form.ficheiro = ficheiro;
    }
}

function removerFicheiro() {
    form.ficheiro = null;
}


async function salvar() {
    if (!form.titulo?.trim()) {
        toast.add({
            severity: 'warn',
            summary: 'Atenção',
            detail: 'O título do documento é obrigatório.',
            life: 4000
        });
        return;
    }

    if (!modoEdicao.value && !form.ficheiro) {
        toast.add({
            severity: 'warn',
            summary: 'Atenção',
            detail: 'Selecione o ficheiro do documento.',
            life: 4000
        });
        return;
    }

    saving.value = true;

    try {
        const fd = new FormData();

        fd.append('titulo', form.titulo.trim());
        fd.append('autor', form.autor?.trim() || '');
        fd.append('ano', form.ano != null ? String(form.ano) : '');
        fd.append('curso_id', form.curso_id != null
            ? String(form.curso_id)
            : '');

        fd.append('hash_sha256', form.hash_sha256?.trim() || '');
        fd.append('ativo', form.ativo ? '1' : '0');
        fd.append(
            'excluir_da_comparacao',
            form.excluir_da_comparacao ? '1' : '0'
        );
        fd.append(
            'motivo_exclusao',
            form.motivo_exclusao?.trim() || ''
        );

        if (form.ficheiro) {
            fd.append('ficheiro', form.ficheiro);
        }

        const resposta = modoEdicao.value
            ? await actualizar(form.id, fd)
            : await criar(fd);

        if (operacaoBemSucedida(resposta)) {
            toast.add({
                severity: 'success',
                summary: 'Sucesso',
                detail: modoEdicao.value
                    ? 'Documento actualizado com sucesso.'
                    : 'Documento criado com sucesso.',
                life: 4000
            });

            showForm.value = false;
            await carregarDados();
        } else {
            toast.add({
                severity: 'error',
                summary: 'Erro',
                detail: mensagemErro(
                    resposta,
                    'Erro ao guardar documento.'
                ),
                life: 5000
            });
        }
    } catch (err) {
        console.error(
            'Erro ao guardar documento:',
            err.response?.data || err
        );

        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: mensagemErro(
                err?.response ?? err,
                'Erro ao guardar documento.'
            ),
            life: 5000
        });
    } finally {
        saving.value = false;
    }
}


function confirmarRemocao(id) {
    confirm.require({
        message: 'Tem a certeza de que deseja eliminar este documento da base de comparação?',
        header: 'Confirmar eliminação',
        icon: 'pi pi-exclamation-triangle',
        rejectLabel: 'Cancelar',
        acceptLabel: 'Eliminar',
        acceptClass: 'p-button-danger',
        accept: () => removerDocumento(id)
    });
}

async function removerDocumento(id) {
    try {
        const resposta = await eliminar(id);
        if (operacaoBemSucedida(resposta)) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Documento eliminado com sucesso.', life: 4000 });
            await carregarDados();
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(resposta, 'Erro ao eliminar documento.'), life: 5000 });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(err?.response ?? err, 'Erro ao eliminar documento.'), life: 5000 });
    }
}
</script>

<template>
    <Toast />
    <ConfirmDialog />

    <div class="documentos-page">
        <!-- Cabeçalho Principal -->
        <div class="page-header">
            <div>
                <h1>Base Documental de Comparação</h1>
                <p>Gerencie os documentos e referências usados para a análise de similaridade.</p>
            </div>
            <Button label="Novo Documento" icon="pi pi-plus" class="btn-primary-custom" @click="abrirNovo" />
        </div>

        <!-- Cartões de Estatísticas -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon-wrapper bg-blue-50 text-blue-600">
                    <i class="pi pi-book text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Total na Base</span>
                    <h3 class="stat-value">{{ totalDocumentos }}</h3>
                    <span class="stat-trend text-blue-600">Documentos registados</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrapper bg-emerald-50 text-emerald-600">
                    <i class="pi pi-check-circle text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Documentos Ativos</span>
                    <h3 class="stat-value">{{ ativosDocumentos }}</h3>
                    <span class="stat-trend text-emerald-600">Disponíveis para consulta</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrapper bg-amber-50 text-amber-600">
                    <i class="pi pi-ban text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Excluídos da Comparação</span>
                    <h3 class="stat-value">{{ excluidosDocumentos }}</h3>
                    <span class="stat-trend text-amber-600">Desativados para cálculo</span>
                </div>
            </div>
        </div>

        <!-- Barra de Ferramentas e Filtros -->
        <div class="toolbar-card">
            <div class="search-wrapper">
                <InputText v-model="search" placeholder="Pesquisar por título, autor ou ficheiro..." class="search-input" />
            </div>
            
            <div class="filters-group">
                <Dropdown v-model="cursoFiltro" :options="[
                    { label: 'Todos os Cursos', value: '' },
                    ...cursos.map(c => ({ label: c.nome, value: c.id }))
                ]" optionLabel="label" optionValue="value" placeholder="Filtrar por Curso" class="w-56" filter />

                <Button icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="carregarDados" v-tooltip.top="'Atualizar lista'" />
            </div>
        </div>

        <!-- Tabela de Documentos -->
        <DataTable :value="documentosFiltrados" :loading="loading" dataKey="id" paginator :rows="10"
            :rowsPerPageOptions="[5, 10, 20, 50]" stripedRows responsiveLayout="scroll"
            class="p-datatable-custom shadow-sm border rounded-xl overflow-hidden"
            emptyMessage="Nenhum documento encontrado na base.">
            
            <Column field="titulo" header="Título do Documento" sortable style="min-width: 16rem;">
                <template #body="{ data }">
                    <strong>{{ data.titulo || '—' }}</strong>
                </template>
            </Column>

            <Column field="autor" header="Autor" sortable style="min-width: 12rem;">
                <template #body="{ data }">
                    <span>{{ data.autor || '—' }}</span>
                </template>
            </Column>

            <Column field="ano" header="Ano" sortable style="width: 7rem;" />

            <Column field="curso_nome" header="Curso" sortable style="min-width: 12rem;">
                <template #body="{ data }">
                    <span>{{ data.curso_nome || '—' }}</span>
                </template>
            </Column>

            <Column field="nome_ficheiro" header="Ficheiro" style="min-width: 12rem;">
                <template #body="{ data }">
                    <span class="text-slate-600 text-sm truncate max-w-xs block">{{ data.nome_ficheiro || '—' }}</span>
                </template>
            </Column>

            <Column field="ativo" header="Ativo" style="width: 8rem;">
                <template #body="{ data }">
                    <Tag :value="(data.ativo === 1 || data.ativo === true) ? 'Sim' : 'Não'" 
                         :severity="(data.ativo === 1 || data.ativo === true) ? 'success' : 'secondary'" />
                </template>
            </Column>

            <Column field="excluir_da_comparacao" header="Excluído" style="width: 9rem;">
                <template #body="{ data }">
                    <Tag :value="(data.excluir_da_comparacao === 1 || data.excluir_da_comparacao === true) ? 'Sim' : 'Não'" 
                         :severity="(data.excluir_da_comparacao === 1 || data.excluir_da_comparacao === true) ? 'warn' : 'info'" />
                </template>
            </Column>

            <Column header="Ações" style="width: 9rem; text-align: center;">
                <template #body="{ data }">
                    <div class="action-buttons">
                        <Button icon="pi pi-pencil" severity="info" text rounded aria-label="Editar"
                            v-tooltip.top="'Editar documento'" @click="editar(data)" />
                        <Button icon="pi pi-trash" severity="danger" text rounded aria-label="Eliminar"
                            v-tooltip.top="'Eliminar documento'" @click="confirmarRemocao(data.id)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Diálogo de Gestão de Documento -->
        <Dialog v-model:visible="showForm" :header="modoEdicao ? 'Editar Documento de Comparação' : 'Novo Documento de Comparação'" modal
            :style="{ width: 'min(95vw, 680px)' }" :closable="!saving">
            <form class="documento-form" @submit.prevent="salvar">
                
                <div class="field">
                    <label for="titulo">Título do Documento *</label>
                    <InputText id="titulo" v-model="form.titulo" class="w-full form-input"
                        placeholder="Ex: Arquitetura de Sistemas Baseados em IA" />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="field">
                        <label for="autor">Autor</label>
                        <InputText id="autor" v-model="form.autor" class="w-full form-input"
                            placeholder="Nome do autor" />
                    </div>

                    <div class="field">
                        <label for="ano">Ano</label>
                        <InputNumber id="ano" v-model="form.ano" :useGrouping="false" :min="1900" :max="2100" class="w-full form-input"
                            placeholder="Ex: 2026" />
                    </div>
                </div>

                <div class="field">
                    <label for="curso_id">Curso Associado</label>
                    <Dropdown id="curso_id" v-model="form.curso_id" 
                        :options="cursos.map(c => ({ label: c.nome, value: c.id }))" 
                        optionLabel="label" optionValue="value" placeholder="Selecione o curso" class="w-full" filter />
                </div>

                <!-- Upload de Ficheiro com Preview -->
                <div class="field">
                    <label>Ficheiro do Documento (.pdf, .doc, .docx)</label>
                    
                    <div v-if="!form.ficheiro" class="upload-dropzone border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                        <FileUpload mode="basic" chooseLabel="Selecionar Documento" accept=".pdf,.doc,.docx"
                            class="w-full" @select="onFicheiroChange" />
                        <span class="upload-hint block mt-1 text-xs text-slate-500">Formatos aceites: PDF, DOC, DOCX</span>
                    </div>

                    <div v-else class="file-preview-card border rounded-xl p-3 bg-blue-50 border-blue-200 flex items-center justify-between">
                        <div class="file-preview-info flex items-center gap-3 overflow-hidden">
                            <i class="pi pi-file-pdf text-red-500 text-2xl"></i>
                            <div class="overflow-hidden">
                                <strong class="file-name block text-slate-800 text-sm font-semibold truncate">{{ form.ficheiro.name || 'Ficheiro carregado' }}</strong>
                                <span class="file-size text-xs text-slate-500" v-if="form.ficheiro.size">{{ (form.ficheiro.size / (1024 * 1024)).toFixed(2) }} MB</span>
                            </div>
                        </div>
                        <Button icon="pi pi-trash" severity="danger" text rounded v-tooltip.top="'Remover ficheiro'" @click="removerFicheiro" />
                    </div>
                </div>

                <div class="field">
                    <label for="hash_sha256">Hash SHA-256 (Opcional)</label>
                    <InputText id="hash_sha256" v-model="form.hash_sha256" class="w-full form-input"
                        placeholder="Hash de verificação do ficheiro" />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div class="field-switch flex items-center justify-between border p-3 rounded-xl bg-slate-50 border-slate-200">
                        <label for="ativo" class="font-medium text-slate-700 text-sm cursor-pointer">Documento Ativo</label>
                        <ToggleSwitch v-model="form.ativo" inputId="ativo" />
                    </div>

                    <div class="field-switch flex items-center justify-between border p-3 rounded-xl bg-slate-50 border-slate-200">
                        <label for="excluir" class="font-medium text-slate-700 text-sm cursor-pointer">Excluir da Comparação</label>
                        <ToggleSwitch v-model="form.excluir_da_comparacao" inputId="excluir" />
                    </div>
                </div>

                <div class="field" v-if="form.excluir_da_comparacao">
                    <label for="motivo_exclusao">Motivo de Exclusão</label>
                    <Textarea id="motivo_exclusao" v-model="form.motivo_exclusao" rows="2" class="w-full"
                        placeholder="Descreva o motivo pelo qual este documento foi excluído da comparação" />
                </div>

                <div class="form-actions">
                    <Button type="button" label="Cancelar" severity="secondary" outlined :disabled="saving"
                        @click="showForm = false" />
                    <Button type="submit" :label="modoEdicao ? 'Actualizar Documento' : 'Guardar Documento'" icon="pi pi-save"
                        :loading="saving" class="btn-primary-custom" />
                </div>
            </form>
        </Dialog>

        <div v-if="error" class="p-3 text-red-500 bg-red-50 rounded mt-4 border border-red-200">Erro: {{ error }}</div>
    </div>
</template>

<style scoped>
.documentos-page {
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

.btn-primary-custom {
    background-color: #2563eb !important;
    border-color: #2563eb !important;
}
.btn-primary-custom:hover {
    background-color: #1d4ed8 !important;
    border-color: #1d4ed8 !important;
}

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
    align-items: center;
    gap: 0.75rem;
}

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

.action-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
}

.documento-form {
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

.upload-dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.file-preview-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.file-name {
    max-width: 320px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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