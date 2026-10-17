<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { analiseService } from '@/services/analiseService';
import { useAuth } from '@/composables/useAuth';
import { useMonografias } from '@/composables/useMonografias';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';

const { listar, obter, executar, reanalisar } = analiseService;
const { role, user } = useAuth();
const { listar: listarMonografias, items: monografiasItems } = useMonografias();

const toast = useToast();
const confirm = useConfirm();

// Estados locais reativos
const items = ref([]);
const loading = ref(false);
const saving = ref(false);
const error = ref(null);

const search = ref('');
const estadoFiltro = ref('');

const form = reactive({
    monografia_versao_id: '',
    algoritmo: 'TF-IDF + Similaridade de Cosseno',
    texto_override: ''
});

const showForm = ref(false);

// Estados para o Diálogo de Detalhes
const showDetalhes = ref(false);
const loadingDetalhes = ref(false);
const analiseSelecionada = ref(null);

/* Normalizadores e Utilitários */
function extrairLista(resposta) {
    const corpo = resposta?.data ?? resposta;
    if (Array.isArray(corpo)) return corpo;
    if (Array.isArray(corpo?.data)) return corpo.data;
    if (Array.isArray(corpo?.analises)) return corpo.analises;
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

function formatarData(dataStr) {
    if (!dataStr) return '—';
    const data = new Date(dataStr);
    return isNaN(data.getTime()) ? dataStr : data.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function severityEstado(estado) {
    switch (estado) {
        case 'CONCLUIDA':
            return 'success';
        case 'PROCESSANDO':
            return 'warn';
        case 'AGUARDANDO':
            return 'info';
        case 'ERRO':
            return 'danger';
        default:
            return 'secondary';
    }
}

function rotuloEstado(estado) {
    const mapa = {
        AGUARDANDO: 'Aguardando',
        PROCESSANDO: 'Processando',
        CONCLUIDA: 'Concluída',
        ERRO: 'Erro'
    };
    return mapa[estado] || estado || '—';
}

// Estatísticas Computadas
const totalAnalises = computed(() => items.value.length);
const concluidasAnalises = computed(() => items.value.filter(a => a.estado === 'CONCLUIDA').length);
const erroAnalises = computed(() => items.value.filter(a => a.estado === 'ERRO').length);

const analisesFiltradas = computed(() => {
    const termo = search.value.trim().toLowerCase();
    return items.value.filter((a) => {
        const matchBusca = !termo || [
            a.monografia_titulo,
            a.estudante_nome
        ].some(v => String(v ?? '').toLowerCase().includes(termo));

        const matchEstado = !estadoFiltro.value || a.estado === estadoFiltro.value;
        return matchBusca && matchEstado;
    });
});

const podeExecutar = computed(() => role.value === 'ADMIN' || role.value === 'DOCENTE' || user.value?.role_nome === 'ADMIN' || user.value?.role_nome === 'DOCENTE');

onMounted(async () => {
    await carregarDados();
});

async function carregarDados() {
    loading.value = true;
    error.value = null;
    try {
        const resposta = await listar({ search: '', estado: '' });
        items.value = extrairLista(resposta);
        await listarMonografias();
    } catch (err) {
        error.value = err.message || 'Erro ao carregar análises.';
        toast.add({ severity: 'error', summary: 'Erro', detail: error.value, life: 5000 });
    } finally {
        loading.value = false;
    }
}

function abrirExecutar() {
    Object.assign(form, {
        monografia_versao_id: '',
        algoritmo: 'TF-IDF + Similaridade de Cosseno',
        texto_override: ''
    });
    showForm.value = true;
}

// Função para abrir e carregar os detalhes da análise
async function verDetalhes(id) {
    loadingDetalhes.value = true;
    analiseSelecionada.value = null;
    showDetalhes.value = true;
    try {
        const resposta = await obter(id);
        analiseSelecionada.value = resposta?.data ?? resposta;
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar detalhes da análise.', life: 4000 });
        showDetalhes.value = false;
    } finally {
        loadingDetalhes.value = false;
    }
}

async function handleExecutar() {
    if (!form.monografia_versao_id) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione uma versão de monografia.', life: 4000 });
        return;
    }

    saving.value = true;
    try {
        const payload = {
            monografia_versao_id: Number(form.monografia_versao_id),
            algoritmo: form.algoritmo.trim(),
            texto_override: form.texto_override?.trim() || undefined
        };

        const resposta = await executar(payload);
        if (operacaoBemSucedida(resposta)) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Análise executada com sucesso.', life: 4000 });
            showForm.value = false;
            await carregarDados();
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(resposta, 'Erro ao executar análise.'), life: 5000 });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(err?.response ?? err, 'Erro ao executar análise.'), life: 5000 });
    } finally {
        saving.value = false;
    }
}

function confirmarReanalise(id) {
    confirm.require({
        message: 'Deseja solicitar uma nova análise deste registo?',
        header: 'Confirmar reanálise',
        icon: 'pi pi-exclamation-triangle',
        rejectLabel: 'Cancelar',
        acceptLabel: 'Reanalisar',
        acceptClass: 'p-button-info',
        accept: () => executarReanalise(id)
    });
}

async function executarReanalise(id) {
    try {
        const resposta = await reanalisar(id);
        if (operacaoBemSucedida(resposta)) {
            toast.add({ severity: 'info', summary: 'Reanálise', detail: 'Análise redefinida para aguardando.', life: 4000 });
            await carregarDados();
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(resposta, 'Erro ao reanalisar.'), life: 5000 });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(err?.response ?? err, 'Erro ao reanalisar registo.'), life: 5000 });
    }
}
</script>

<template>
    <Toast />
    <ConfirmDialog />

    <div class="analises-page">
        <!-- Cabeçalho Principal -->
        <div class="page-header">
            <div>
                <h1>Análises de Similaridade</h1>
                <p>Gerir e acompanhar o processo de análise de similaridade das monografias.</p>
            </div>
            <Button v-if="podeExecutar" label="Executar Análise" icon="pi pi-play" class="btn-primary-custom" @click="abrirExecutar" />
        </div>

        <!-- Cartões de Estatísticas -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon-wrapper bg-blue-50 text-blue-600">
                    <i class="pi pi-chart-bar text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Total de Análises</span>
                    <h3 class="stat-value">{{ totalAnalises }}</h3>
                    <span class="stat-trend text-blue-600">Registadas</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrapper bg-emerald-50 text-emerald-600">
                    <i class="pi pi-check-circle text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Concluídas</span>
                    <h3 class="stat-value">{{ concluidasAnalises }}</h3>
                    <span class="stat-trend text-emerald-600">Processadas com sucesso</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrapper bg-red-50 text-red-600">
                    <i class="pi pi-exclamation-circle text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Com Erro</span>
                    <h3 class="stat-value">{{ erroAnalises }}</h3>
                    <span class="stat-trend text-red-600">Requer atenção</span>
                </div>
            </div>
        </div>

        <!-- Barra de Ferramentas e Filtros -->
        <div class="toolbar-card">
            <div class="search-wrapper">
                <InputText v-model="search" placeholder="Pesquisar por título ou estudante..." class="search-input" />
            </div>
            
            <div class="filters-group">
                <Dropdown v-model="estadoFiltro" :options="[
                    { label: 'Todos os Estados', value: '' },
                    { label: 'Aguardando', value: 'AGUARDANDO' },
                    { label: 'Processando', value: 'PROCESSANDO' },
                    { label: 'Concluída', value: 'CONCLUIDA' },
                    { label: 'Erro', value: 'ERRO' }
                ]" optionLabel="label" optionValue="value" placeholder="Filtrar por Estado" class="w-48" />

                <Button icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="carregarDados" v-tooltip.top="'Atualizar lista'" />
            </div>
        </div>

        <!-- Tabela de Análises -->
        <DataTable :value="analisesFiltradas" :loading="loading" dataKey="id" paginator :rows="10"
            :rowsPerPageOptions="[5, 10, 20, 50]" stripedRows responsiveLayout="scroll"
            class="p-datatable-custom shadow-sm border rounded-xl overflow-hidden"
            emptyMessage="Nenhuma análise encontrada.">
            
            <Column field="monografia_titulo" header="Monografia" sortable style="min-width: 15rem;">
                <template #body="{ data }">
                    <strong>{{ data.monografia_titulo || '—' }}</strong>
                </template>
            </Column>

            <Column field="estudante_nome" header="Estudante" sortable style="min-width: 12rem;">
                <template #body="{ data }">
                    <span>{{ data.estudante_nome || '—' }}</span>
                </template>
            </Column>

            <Column field="numero_versao" header="Versão" sortable style="width: 7rem;">
                <template #body="{ data }">
                    <Tag severity="info" :value="`v${data.numero_versao || 1}`" rounded />
                </template>
            </Column>

            <Column field="estado" header="Estado" style="width: 10rem;">
                <template #body="{ data }">
                    <Tag :value="rotuloEstado(data.estado)" :severity="severityEstado(data.estado)" />
                </template>
            </Column>

            <Column field="similaridade_geral" header="Similaridade (%)" sortable style="min-width: 10rem;">
                <template #body="{ data }">
                    <span :class="Number(data.similaridade_geral) > 30 ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'">
                        {{ data.similaridade_geral !== undefined && data.similaridade_geral !== null ? `${data.similaridade_geral}%` : '—' }}
                    </span>
                </template>
            </Column>

            <Column field="classificacao" header="Classificação" style="min-width: 10rem;">
                <template #body="{ data }">
                    <span>{{ data.classificacao || '—' }}</span>
                </template>
            </Column>

            <Column field="data_conclusao" header="Concluída em" sortable style="min-width: 11rem;">
                <template #body="{ data }">
                    <span>{{ formatarData(data.data_conclusao) }}</span>
                </template>
            </Column>

            <Column header="Ações" style="width: 8rem; text-align: center;">
                <template #body="{ data }">
                    <div class="action-buttons">
                        <Button icon="pi pi-eye" severity="info" text rounded aria-label="Ver Detalhes"
                            v-tooltip.top="'Ver detalhes da análise'" @click="verDetalhes(data.id)" />
                        <Button v-if="podeExecutar && data.estado === 'ERRO'" icon="pi pi-redo" severity="warning" text rounded aria-label="Reanalisar"
                            v-tooltip.top="'Solicitar nova análise'" @click="confirmarReanalise(data.id)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Diálogo para Executar Nova Análise (Algoritmo Ocultado) -->
        <Dialog v-model:visible="showForm" header="Executar Nova Análise" modal
            :style="{ width: 'min(95vw, 560px)' }" :closable="!saving">
            <form class="analise-form" @submit.prevent="handleExecutar">
                
                <div class="field">
                    <label for="monografia_versao_id">Versão da Monografia *</label>
                    <Dropdown id="monografia_versao_id" v-model="form.monografia_versao_id" 
                        :options="monografiasItems.map(m => ({ label: `${m.titulo} (v${m.numero_versao || 1})`, value: m.id }))" 
                        optionLabel="label" optionValue="value" placeholder="Selecione a versão da monografia" class="w-full" filter />
                </div>

                <div class="field">
                    <label for="texto_override">Texto para Análise (Opcional)</label>
                    <Textarea id="texto_override" v-model="form.texto_override" rows="3" class="w-full"
                        placeholder="Deixe vazio para usar automaticamente o texto extraído do ficheiro original" />
                </div>

                <div class="form-actions">
                    <Button type="button" label="Cancelar" severity="secondary" outlined :disabled="saving"
                        @click="showForm = false" />
                    <Button type="submit" label="Executar Análise" icon="pi pi-play"
                        :loading="saving" class="btn-primary-custom" />
                </div>
            </form>
        </Dialog>

        <!-- Diálogo para Ver Detalhes e Trechos Encontrados -->
        <Dialog v-model:visible="showDetalhes" header="Detalhes da Análise de Similaridade" modal
            :style="{ width: 'min(95vw, 750px)' }">
            <div v-if="loadingDetalhes" class="flex flex-col items-center justify-center p-8 gap-3">
                <i class="pi pi-spin pi-spinner text-3xl text-blue-600"></i>
                <span class="text-sm text-slate-500">A carregar detalhes da análise...</span>
            </div>

            <div v-else-if="analiseSelecionada" class="detalhes-content flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1">
                <!-- Informações Principais -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                        <span class="text-xs text-slate-500 font-medium block">Monografia</span>
                        <strong class="text-slate-800">{{ analiseSelecionada.monografia_titulo || '—' }} (v{{ analiseSelecionada.numero_versao || 1 }})</strong>
                    </div>
                    <div>
                        <span class="text-xs text-slate-500 font-medium block">Estudante</span>
                        <strong class="text-slate-800">{{ analiseSelecionada.estudante_nome || '—' }}</strong>
                    </div>
                    <div>
                        <span class="text-xs text-slate-500 font-medium block">Estado Atual</span>
                        <Tag :value="rotuloEstado(analiseSelecionada.estado)" :severity="severityEstado(analiseSelecionada.estado)" />
                    </div>
                    <div>
                        <span class="text-xs text-slate-500 font-medium block">Concluído em</span>
                        <span class="text-slate-700 text-sm">{{ formatarData(analiseSelecionada.data_conclusao) }}</span>
                    </div>
                </div>

                <!-- Métricas de Similaridade -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-4 border rounded-xl bg-white flex flex-col justify-center items-center text-center">
                        <span class="text-xs text-slate-500 font-medium mb-1">Taxa de Similaridade Geral</span>
                        <h2 class="text-2xl font-bold" :class="Number(analiseSelecionada.similaridade_geral) > 30 ? 'text-red-600' : 'text-emerald-600'">
                            {{ analiseSelecionada.similaridade_geral !== undefined && analiseSelecionada.similaridade_geral !== null ? `${analiseSelecionada.similaridade_geral}%` : '—' }}
                        </h2>
                    </div>
                    <div class="p-4 border rounded-xl bg-white flex flex-col justify-center items-center text-center">
                        <span class="text-xs text-slate-500 font-medium mb-1">Classificação</span>
                        <h3 class="text-lg font-semibold text-slate-800">
                            {{ analiseSelecionada.classificacao || 'Não classificado' }}
                        </h3>
                    </div>
                </div>

                <!-- Lista de Resultados e Trechos Encontrados -->
                <div v-if="analiseSelecionada.resultados && analiseSelecionada.resultados.length > 0" class="flex flex-col gap-3 mt-2">
                    <h3 class="font-bold text-slate-800 text-base">Documentos e Trechos Semelhantes Encontrados</h3>
                    
                    <div v-for="res in analiseSelecionada.resultados" :key="res.id" class="border rounded-xl p-4 bg-slate-50 border-slate-200 flex flex-col gap-3">
                        <div class="flex items-center justify-between border-b pb-2">
                            <div>
                                <span class="text-xs text-slate-500 block">Documento Comparado</span>
                                <strong class="text-slate-800 text-sm">{{ res.documento_titulo }} (Autor: {{ res.documento_autor || 'Desconhecido' }})</strong>
                            </div>
                            <div class="text-right">
                                <Tag severity="danger" :value="`${res.percentual_similaridade}% Similaridade`" />
                                <span class="text-xs text-slate-500 block mt-1">{{ res.quantidade_trechos }} trecho(s) detetado(s)</span>
                            </div>
                        </div>

                        <!-- Trechos Encontrados -->
                        <div v-if="res.trechos && res.trechos.length > 0" class="flex flex-col gap-2">
                            <span class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Trechos Correspondentes:</span>
                            
                            <div v-for="(trecho, index) in res.trechos" :key="index" class="bg-white p-3 rounded-lg border border-slate-200 text-xs flex flex-col gap-1.5">
                                <div class="flex justify-between text-slate-400 font-mono text-[10px]">
                                    <span>Trecho #{{ index + 1 }}</span>
                                    <span>Similaridade: {{ trecho.percentual_similaridade }}%</span>
                                </div>
                                <div class="bg-amber-50 p-2 rounded text-slate-700 border-l-2 border-amber-400">
                                    <strong class="text-[11px] text-amber-900 block mb-0.5">Texto Origem:</strong>
                                    {{ trecho.texto_documento_origem }}
                                </div>
                                <div class="bg-blue-50 p-2 rounded text-slate-700 border-l-2 border-blue-400">
                                    <strong class="text-[11px] text-blue-900 block mb-0.5">Texto Comparado:</strong>
                                    {{ trecho.texto_documento_comparado }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="p-4 text-center bg-slate-50 rounded-xl border text-slate-500 text-sm">
                    Nenhum trecho ou cruzamento documental registado nesta análise.
                </div>
            </div>

            <template #footer>
                <Button label="Fechar" severity="secondary" outlined @click="showDetalhes = false" />
            </template>
        </Dialog>

        <div v-if="error" class="p-3 text-red-500 bg-red-50 rounded mt-4 border border-red-200">Erro: {{ error }}</div>
    </div>
</template>

<style scoped>
.analises-page {
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

.analise-form {
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

@media (max-width: 768px) {
    .toolbar-card, .page-header {
        flex-direction: column;
        align-items: stretch;
    }
}
</style>