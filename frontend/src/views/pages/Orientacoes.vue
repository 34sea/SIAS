<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { orientacaoService } from '@/services/orientacaoService';
import { estudanteService } from '@/services/estudanteService';
import { docenteService } from '@/services/docenteService';
import { useToast } from 'primevue/usetoast';
import { API_URL_GLOB } from '@/urls/globalsUrls';
import { useConfirm } from 'primevue/useconfirm';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';

const { listar, criar, actualizar, eliminar } = orientacaoService;
const { API_URL } = API_URL_GLOB;
const { listar: listarEstudantes } = estudanteService;
const { listar: listarDocentes } = docenteService;

const toast = useToast();
const confirm = useConfirm();

const orientacoes = ref([]);
const estudantes = ref([]);
const docentes = ref([]);
const loading = ref(false);
const saving = ref(false);
const error = ref(null);
const search = ref('');

const form = reactive({
    id: null,
    estudante_id: '',
    docente_id: '',
    data_inicio: null,
    data_fim: null,
    estado: 'ATIVA',
    observacoes: ''
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
    if (Array.isArray(corpo?.orientacoes)) return corpo.orientacoes;
    if (Array.isArray(corpo?.estudantes)) return corpo.estudantes;
    if (Array.isArray(corpo?.docentes)) return corpo.docentes;
    return [];
}

// Estatísticas Computadas
const totalOrientacoes = computed(() => orientacoes.value.length);
const ativasOrientacoes = computed(() => orientacoes.value.filter(o => o.estado === 'ATIVA').length);
const concluidasOrientacoes = computed(() => orientacoes.value.filter(o => o.estado === 'CONCLUIDA').length);

const orientacoesFiltradas = computed(() => {
    const termo = search.value.trim().toLowerCase();
    if (!termo) return orientacoes.value;

    return orientacoes.value.filter((o) => {
        return [
            o.estudante_nome,
            o.docente_nome,
            o.estado,
            o.observacoes
        ].some((valor) => String(valor ?? '').toLowerCase().includes(termo));
    });
});

onMounted(async () => {
    await carregarDados();
});

async function carregarDados() {
    loading.value = true;
    try {
        const [respostaOrientacoes, respostaEstudantes, respostaDocentes] = await Promise.all([
            listar({}), listarEstudantes({}), listarDocentes({})
        ]);
        orientacoes.value = extrairLista(respostaOrientacoes);
        estudantes.value = extrairLista(respostaEstudantes);
        docentes.value = extrairLista(respostaDocentes);
    } catch (err) {
        error.value = err.message || 'Erro ao carregar dados.';
        toast.add({ severity: 'error', summary: 'Erro', detail: error.value, life: 5000 });
    } finally {
        loading.value = false;
    }
}

function abrirNovo() {
    Object.assign(form, { id: null, estudante_id: '', docente_id: '', data_inicio: null, data_fim: null, estado: 'ATIVA', observacoes: '' });
    modoEdicao.value = false;
    showForm.value = true;
}

function editar(item) {
    Object.assign(form, {
        id: item.id,
        estudante_id: item.estudante_id,
        docente_id: item.docente_id,
        data_inicio: item.data_inicio ? new Date(item.data_inicio) : null,
        data_fim: item.data_fim ? new Date(item.data_fim) : null,
        estado: item.estado || 'ATIVA',
        observacoes: item.observacoes || ''
    });
    modoEdicao.value = true;
    showForm.value = true;
}

async function salvar() {
    if (!form.estudante_id || !form.docente_id) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Estudante e docente são obrigatórios.', life: 4000 });
        return;
    }

    saving.value = true;
    try {
        const payload = {
            estudante_id: form.estudante_id,
            docente_id: form.docente_id,
            data_inicio: form.data_inicio ? new Date(form.data_inicio).toISOString().split('T')[0] : null,
            data_fim: form.data_fim ? new Date(form.data_fim).toISOString().split('T')[0] : null,
            estado: form.estado,
            observacoes: form.observacoes?.trim() || null
        };

        const resposta = modoEdicao.value
            ? await actualizar(form.id, payload)
            : await criar(payload);

        if (operacaoBemSucedida(resposta)) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: modoEdicao.value ? 'Orientação actualizada.' : 'Orientação registada.', life: 4000 });
            showForm.value = false;

            const respostaOrientacoes = await listar({});
            orientacoes.value = extrairLista(respostaOrientacoes);
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(resposta, 'A API não confirmou a operação.'), life: 5000 });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(err?.response ?? err, 'Erro ao guardar orientação.'), life: 5000 });
    } finally {
        saving.value = false;
    }
}

function confirmarRemocao(item) {
    confirm.require({
        message: `Tem a certeza de que deseja eliminar esta orientação?`,
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
        const resposta = await eliminar(id);
        if (operacaoBemSucedida(resposta)) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Orientação eliminada.', life: 4000 });
            const respostaOrientacoes = await listar({});
            orientacoes.value = extrairLista(respostaOrientacoes);
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(resposta, 'Erro ao eliminar.'), life: 5000 });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(err?.response ?? err, 'Erro ao eliminar orientação.'), life: 5000 });
    }
}

function formatarData(dataStr) {
    if (!dataStr) return '—';
    const data = new Date(dataStr);
    return isNaN(data.getTime()) ? dataStr : data.toLocaleDateString('pt-PT');
}
</script>

<template>
    <Toast />
    <ConfirmDialog />

    <div class="orientacoes-page">
        <!-- Cabeçalho Principal -->
        <div class="page-header">
            <div>
                <h1>Gestão de Orientações</h1>
                <p>Associe e administre os estudantes aos respectivos orientadores no sistema.</p>
            </div>
            <Button label="Adicionar Nova Orientação" icon="pi pi-plus" class="btn-primary-custom" @click="abrirNovo" />
        </div>

        <!-- Cartões de Estatísticas -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon-wrapper bg-blue-50 text-blue-600">
                    <i class="pi pi-link text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Total de Orientações</span>
                    <h3 class="stat-value">{{ totalOrientacoes }}</h3>
                    <span class="stat-trend text-blue-600">Registadas</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrapper bg-emerald-50 text-emerald-600">
                    <i class="pi pi-check-circle text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Orientações Ativas</span>
                    <h3 class="stat-value">{{ ativasOrientacoes }}</h3>
                    <span class="stat-trend text-emerald-600">Ativas</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrapper bg-purple-50 text-purple-600">
                    <i class="pi pi-flag text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Orientações Concluídas</span>
                    <h3 class="stat-value">{{ concluidasOrientacoes }}</h3>
                    <span class="stat-trend text-purple-600">Concluídas</span>
                </div>
            </div>
        </div>

        <!-- Barra de Ferramentas e Filtros -->
        <div class="toolbar-card">
            <div class="search-wrapper">
                <InputText v-model="search" placeholder="Pesquisar por estudante, orientador ou estado..."
                    class="search-input" />
            </div>

            <div class="filters-group">
                <Button icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="carregarDados"
                    v-tooltip.top="'Atualizar lista'" />
            </div>
        </div>

        <!-- Tabela de Orientações com Fotos -->
        <DataTable :value="orientacoesFiltradas" :loading="loading" dataKey="id" paginator :rows="10"
            :rowsPerPageOptions="[5, 10, 20, 50]" stripedRows responsiveLayout="scroll"
            class="p-datatable-custom shadow-sm border rounded-xl overflow-hidden"
            emptyMessage="Nenhuma orientação encontrada.">

            <Column field="estudante_nome" header="Estudante" sortable style="min-width: 16rem;">
                <template #body="{ data }">
                    <div class="user-cell" style="display: flex; align-items: center; gap: 2px; justify-content: flex-start;">
                        <img v-if="data.estudante_foto"
                            :src="data.estudante_foto.startsWith('http') ? data.estudante_foto : `${API_URL}${data.estudante_foto}`"
                            alt="Foto do Estudante" class="user-avatar" />
                        <div v-else class="user-avatar avatar-placeholder">
                            <i class="pi pi-user" />
                        </div>
                        <div>
                            {{ data.estudante_nome || '—' }}
                            <!-- <strong>{{ data.estudante_nome || '—' }}</strong> -->
                            <!-- <small>{{ data.estudante_email }}</small> -->
                        </div>
                    </div>
                </template>
            </Column>

            <Column field="docente_nome" header="Orientador" sortable style="min-width: 16rem;">
                <template #body="{ data }">
                    <div class="user-cell" style="display: flex; align-items: center; gap: 2px; justify-content: flex-start;">
                        <img v-if="data.docente_foto"
                            :src="data.docente_foto.startsWith('http') ? data.docente_foto : `${API_URL}${data.docente_foto}`"
                            alt="Foto do Orientador" class="user-avatar" />
                        <div v-else class="user-avatar avatar-placeholder">
                            <i class="pi pi-user" />
                        </div>
                        <div>
                            <!-- <strong>{{ data.docente_nome || '—' }}</strong> -->
                            {{ data.docente_nome || '—' }}
                            <!-- <small>{{ data.docente_email }}</small> -->
                        </div>
                    </div>
                </template>
            </Column>

            <Column field="data_inicio" header="Início" style="min-width: 10rem;">
                <template #body="{ data }">
                    <span>{{ formatarData(data.data_inicio) }}</span>
                </template>
            </Column>

            <Column field="data_fim" header="Fim" style="min-width: 10rem;">
                <template #body="{ data }">
                    <span>{{ formatarData(data.data_fim) }}</span>
                </template>
            </Column>

            <Column field="estado" header="Estado" style="width: 10rem;">
                <template #body="{ data }">
                    <Tag :value="data.estado === 'ATIVA' ? 'Ativa' : (data.estado === 'CONCLUIDA' ? 'Concluída' : 'Cancelada')"
                        :severity="data.estado === 'ATIVA' ? 'success' : (data.estado === 'CONCLUIDA' ? 'info' : 'danger')" />
                </template>
            </Column>

            <Column header="Ações" style="width: 8rem; text-align: center;">
                <template #body="{ data }">
                    <div class="action-buttons">
                        <Button icon="pi pi-pencil" severity="info" text rounded aria-label="Editar"
                            v-tooltip.top="'Editar orientação'" @click="editar(data)" />
                        <Button icon="pi pi-trash" severity="danger" text rounded aria-label="Remover"
                            v-tooltip.top="'Remover orientação'" @click="confirmarRemocao(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Diálogo de Criação / Edição -->
        <Dialog v-model:visible="showForm" :header="modoEdicao ? 'Editar Orientação' : 'Adicionar Nova Orientação'"
            modal :style="{ width: 'min(95vw, 580px)' }" :closable="!saving">
            <form class="orientacao-form" @submit.prevent="salvar">

                <div class="field">
                    <label for="estudante_id">Estudante *</label>
                    <Dropdown id="estudante_id" v-model="form.estudante_id"
                        :options="estudantes.map(e => ({ label: e.nome_completo, value: e.id }))" optionLabel="label"
                        optionValue="value" placeholder="Selecione o estudante" class="w-full" filter />
                </div>

                <div class="field">
                    <label for="docente_id">Docente / Orientador *</label>
                    <Dropdown id="docente_id" v-model="form.docente_id"
                        :options="docentes.map(d => ({ label: d.nome_completo, value: d.id }))" optionLabel="label"
                        optionValue="value" placeholder="Selecione o docente orientador" class="w-full" filter />
                </div>

                <div class="field">
                    <label for="data_inicio">Data de Início *</label>
                    <Calendar id="data_inicio" v-model="form.data_inicio" dateFormat="yy-mm-dd" showIcon class="w-full"
                        placeholder="Selecione a data de início" />
                </div>

                <div class="field">
                    <label for="data_fim">Data de Fim (opcional)</label>
                    <Calendar id="data_fim" v-model="form.data_fim" dateFormat="yy-mm-dd" showIcon class="w-full"
                        placeholder="Selecione a data de fim" />
                </div>

                <div class="field">
                    <label for="estado">Estado *</label>
                    <Dropdown id="estado" v-model="form.estado" :options="[
                        { label: 'Ativa', value: 'ATIVA' },
                        { label: 'Concluída', value: 'CONCLUIDA' },
                        { label: 'Cancelada', value: 'CANCELADA' }
                    ]" optionLabel="label" optionValue="value" class="w-full" />
                </div>

                <div class="field">
                    <label for="observacoes">Observações</label>
                    <InputText id="observacoes" v-model="form.observacoes" class="w-full form-input"
                        placeholder="Observações adicionais (opcional)" />
                </div>

                <div class="form-actions">
                    <Button type="button" label="Cancelar" severity="secondary" outlined :disabled="saving"
                        @click="showForm = false" />
                    <Button type="submit" :label="modoEdicao ? 'Guardar' : 'Salvar'" icon="pi pi-check"
                        :loading="saving" class="btn-primary-custom" />
                </div>
            </form>
        </Dialog>

        <div v-if="error" class="p-3 text-red-500 bg-red-50 rounded mt-4 border border-red-200">Erro: {{ error }}</div>
    </div>
</template>

<style scoped>
.orientacoes-page {
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

.orientacao-form {
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

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1rem;
    border-top: 1px solid #e2e8f0;
    padding-top: 1rem;
}

.user-avatar {
    width: 40px !important;
    height: 40px !important;
    min-width: 40px !important;
    min-height: 40px !important;
    border-radius: 50% !important;
    object-fit: cover !important;
    border: 2px solid #e2e8f0;
}

.avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1f5f9;
    color: #64748b;
    font-size: 1rem;
}

@media (max-width: 768px) {

    .toolbar-card,
    .page-header {
        flex-direction: column;
        align-items: stretch;
    }
}
</style>