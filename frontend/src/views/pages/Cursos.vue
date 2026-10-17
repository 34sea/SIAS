<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { cursoService } from '@/services/cursoService';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Checkbox from 'primevue/checkbox';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';

const toast = useToast();
const confirm = useConfirm();

const cursos = ref([]);
const loading = ref(false);
const saving = ref(false);
const error = ref(null);
const search = ref('');

const form = reactive({ 
    id: null, 
    nome: '', 
    codigo: '', 
    descricao: '', 
    ativo: true 
});

const showForm = ref(false);
const modoEdicao = ref(false);

/*
 * Normalizadores padrão da aplicação
 */
function obterCorpo(resposta) {
    return resposta?.data ?? resposta;
}

function operacaoBemSucedida(resposta) {
    const status = Boolean(
        resposta?.success
    );

    if (status) {
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
    if (Array.isArray(corpo?.cursos)) return corpo.cursos;
    return [];
}

// Estatísticas Computadas
const totalCursos = computed(() => cursos.value.length);
const ativosCursos = computed(() => cursos.value.filter(c => Number(c.ativo) === 1 || c.ativo === true).length);
const inativosCursos = computed(() => totalCursos.value - ativosCursos.value);

const cursosFiltrados = computed(() => {
    const termo = search.value.trim().toLowerCase();
    if (!termo) return cursos.value;

    return cursos.value.filter((c) => {
        return [
            c.nome,
            c.codigo,
            c.descricao
        ].some((valor) => String(valor ?? '').toLowerCase().includes(termo));
    });
});

onMounted(async () => {
    await carregarDados();
});

async function carregarDados() {
    loading.value = true;
    try {
        const resposta = await cursoService.listar({});
        cursos.value = extrairLista(resposta);
    } catch (err) {
        error.value = err.message || 'Erro ao carregar cursos.';
        toast.add({ severity: 'error', summary: 'Erro', detail: error.value, life: 5000 });
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
        nome: item.nome || '',
        codigo: item.codigo || '',
        descricao: item.descricao || '',
        ativo: Number(item.ativo) === 1 || item.ativo === true
    });
    modoEdicao.value = true;
    showForm.value = true;
}

async function salvar() {
    if (!form.nome || !form.codigo) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Nome e código são obrigatórios.', life: 4000 });
        return;
    }

    saving.value = true;
    try {
        const payload = {
            nome: form.nome.trim(),
            codigo: form.codigo.trim(),
            descricao: form.descricao?.trim() || null,
            ativo: form.ativo ? 1 : 0
        };

        const resposta = modoEdicao.value
            ? await cursoService.actualizar(form.id, payload)
            : await cursoService.criar(payload);

        if (operacaoBemSucedida(resposta)) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: modoEdicao.value ? 'Curso actualizado.' : 'Curso criado.', life: 4000 });
            showForm.value = false;
            await carregarDados();
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(resposta, 'A API não confirmou a operação.'), life: 5000 });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(err?.response ?? err, 'Erro ao guardar curso.'), life: 5000 });
    } finally {
        saving.value = false;
    }
}

function confirmarRemocao(item) {
    confirm.require({
        message: `Tem a certeza de que deseja eliminar o curso "${item.nome}"?`,
        header: 'Confirmar remoção',
        icon: 'pi pi-exclamation-triangle',
        rejectLabel: 'Cancelar',
        acceptLabel: 'Remover',
        acceptClass: 'p-button-danger',
        accept: () => remover(item.id)
    });
}

async function remover(id) {
    try {
        const resposta = await cursoService.eliminar(id);
        if (operacaoBemSucedida(resposta)) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Curso eliminado.', life: 4000 });
            await carregarDados();
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(resposta, 'Erro ao eliminar.'), life: 5000 });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(err?.response ?? err, 'Erro ao eliminar curso.'), life: 5000 });
    }
}
</script>

<template>
    <Toast />
    <ConfirmDialog />

    <div class="cursos-page">
        <!-- Cabeçalho Principal -->
        <div class="page-header">
            <div>
                <h1>Gestão de Cursos</h1>
                <p>Cadastre e administre os cursos académicos da instituição.</p>
            </div>
            <Button label="Novo" icon="pi pi-plus" class="btn-primary-custom" @click="abrirNovo" />
        </div>

        <!-- Cartões de Estatísticas -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon-wrapper bg-blue-50 text-blue-600">
                    <i class="pi pi-book text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Total de Cursos</span>
                    <h3 class="stat-value">{{ totalCursos }}</h3>
                    <span class="stat-trend text-blue-600">Registados</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrapper bg-emerald-50 text-emerald-600">
                    <i class="pi pi-check-circle text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Cursos Ativos</span>
                    <h3 class="stat-value">{{ ativosCursos }}</h3>
                    <span class="stat-trend text-emerald-600">Ativos</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrapper bg-red-50 text-red-600">
                    <i class="pi pi-minus-circle text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Cursos Inativos</span>
                    <h3 class="stat-value">{{ inativosCursos }}</h3>
                    <span class="stat-trend text-red-600">Inativos</span>
                </div>
            </div>
        </div>

        <!-- Barra de Ferramentas e Filtros -->
        <div class="toolbar-card">
            <div class="search-wrapper">
                <InputText v-model="search" placeholder="Pesquisar por nome, código ou descrição..." class="search-input" />
            </div>
            
            <div class="filters-group">
                <Button icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="carregarDados" v-tooltip.top="'Atualizar lista'" />
            </div>
        </div>

        <!-- Tabela de Cursos -->
        <DataTable :value="cursosFiltrados" :loading="loading" dataKey="id" paginator :rows="10"
            :rowsPerPageOptions="[5, 10, 20, 50]" stripedRows responsiveLayout="scroll"
            class="p-datatable-custom shadow-sm border rounded-xl overflow-hidden"
            emptyMessage="Nenhum curso encontrado.">
            
            <Column field="nome" header="Nome do Curso" sortable style="min-width: 15rem;">
                <template #body="{ data }">
                    <strong>{{ data.nome }}</strong>
                </template>
            </Column>

            <Column field="codigo" header="Código" sortable style="min-width: 9rem;">
                <template #body="{ data }">
                    <Tag severity="info" :value="data.codigo || '—'" rounded />
                </template>
            </Column>

            <Column field="total_estudantes" header="Estudantes" sortable style="min-width: 9rem;">
                <template #body="{ data }">
                    <Tag severity="success" :value="`${data.total_estudantes || 0} ${data.total_estudantes === 1 ? 'aluno' : 'alunos'}`" rounded />
                </template>
            </Column>

            <Column field="descricao" header="Descrição" style="min-width: 15rem;">
                <template #body="{ data }">
                    <span class="text-secondary">{{ data.descricao || '—' }}</span>
                </template>
            </Column>

            <Column header="Estado" style="width: 9rem;">
                <template #body="{ data }">
                    <Tag :value="(Number(data.ativo) === 1 || data.ativo === true) ? 'Ativo' : 'Inativo'"
                        :severity="(Number(data.ativo) === 1 || data.ativo === true) ? 'success' : 'danger'" />
                </template>
            </Column>

            <Column header="Ações" style="width: 8rem; text-align: center;">
                <template #body="{ data }">
                    <div class="action-buttons">
                        <Button icon="pi pi-pencil" severity="info" text rounded aria-label="Editar"
                            v-tooltip.top="'Editar curso'" @click="editar(data)" />
                        <Button icon="pi pi-trash" severity="danger" text rounded aria-label="Remover"
                            v-tooltip.top="'Remover curso'" @click="confirmarRemocao(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Diálogo de Criação / Edição -->
        <Dialog v-model:visible="showForm" :header="modoEdicao ? 'Editar Curso' : 'Novo'" modal
            :style="{ width: 'min(95vw, 540px)' }" :closable="!saving">
            <form class="curso-form" @submit.prevent="salvar">
                
                <div class="field">
                    <label for="nome">Nome do Curso *</label>
                    <InputText id="nome" v-model="form.nome" class="w-full form-input"
                        placeholder="Ex: Engenharia Informática" />
                </div>

                <div class="field">
                    <label for="codigo">Código *</label>
                    <InputText id="codigo" v-model="form.codigo" class="w-full form-input"
                        placeholder="Ex: ENG-INF" />
                </div>

                <div class="field">
                    <label for="descricao">Descrição</label>
                    <Textarea id="descricao" v-model="form.descricao" rows="3" class="w-full"
                        placeholder="Descrição detalhada do curso (opcional)" />
                </div>

                <div class="field checkbox-field">
                    <Checkbox v-model="form.ativo" :binary="true" inputId="ativo" />
                    <label for="ativo">Curso ativo</label>
                </div>

                <div class="form-actions">
                    <Button type="button" label="Cancelar" severity="secondary" outlined :disabled="saving"
                        @click="showForm = false" />
                    <Button type="submit" :label="modoEdicao ? 'Guardar' : 'Salvar'"
                        icon="pi pi-check" :loading="saving" class="btn-primary-custom" />
                </div>
            </form>
        </Dialog>

        <div v-if="error" class="p-3 text-red-500 bg-red-50 rounded mt-4 border border-red-200">Erro: {{ error }}</div>
    </div>
</template>

<style scoped>
.cursos-page {
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

.text-secondary {
    color: #64748b;
    font-size: 0.9rem;
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

.curso-form {
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