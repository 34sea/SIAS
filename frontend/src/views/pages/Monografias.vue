<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { monografiaService } from '@/services/monografiaService';
import { estudanteService } from '@/services/estudanteService';
import { orientacaoService } from '@/services/orientacaoService';
import { useAuth } from '@/composables/useAuth';
import { useNotificacoes } from '@/composables/useNotificacoes';
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
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';

const { listar, submeter, carregarVersoes, submeterVersao, arquivar } = monografiaService;
const { obterPorUtilizador } = estudanteService || {};
const { listar: listarOrientacoes } = orientacaoService;

const { role, user } = useAuth();
const { listar: listarNotificacoes } = useNotificacoes(user.value?.id);

const toast = useToast();
const confirm = useConfirm();

// Estados locais
const items = ref([]);
const total = ref(0);
const loading = ref(false);
const versoes = ref([]);
const error = ref(null);

const saving = ref(false);
const search = ref('');
const estadoFiltro = ref('');

// Dados Vinculados do Estudante
const dadosEstudanteVinculados = reactive({
    estudante_id: null,
    curso_id: null,
    curso_nome: 'A carregar...',
    orientador_id: null,
    orientador_nome: 'Nenhum orientador associado'
});

// Utilizador do LocalStorage
const utilizadorLogado = computed(() => {
    try {
        const local = localStorage.getItem('sias_user');
        return local ? JSON.parse(local) : (user.value || {});
    } catch {
        return user.value || {};
    }
});

const form = reactive({
    estudante_id: '',
    orientador_id: '',
    curso_id: '',
    titulo: '',
    ano: new Date().getFullYear(),
    descricao: '',
    ficheiro: null
});

const showForm = ref(false);
const showVersoes = ref(false);
const monografiaSelecionada = ref(null);

function extrairLista(resposta) {
    const corpo = resposta?.data ?? resposta;
    if (Array.isArray(corpo)) return corpo;
    if (Array.isArray(corpo?.data)) return corpo.data;
    if (Array.isArray(corpo?.monografias)) return corpo.monografias;
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
    return isNaN(data.getTime()) ? dataStr : data.toLocaleDateString('pt-PT');
}

function severityEstado(estado) {
    switch (estado) {
        case 'RELATORIO_DISPONIVEL':
        case 'ANALISADA':
            return 'success';
        case 'EM_ANALISE':
        case 'AGUARDANDO_ANALISE':
            return 'warn';
        case 'SUBMETIDA':
            return 'info';
        case 'ERRO_PROCESSAMENTO':
            return 'danger';
        default:
            return 'secondary';
    }
}

function rotuloEstado(estado) {
    const mapa = {
        SUBMETIDA: 'Submetida',
        AGUARDANDO_ANALISE: 'Aguardando Análise',
        EM_ANALISE: 'Em Análise',
        ANALISADA: 'Analisada',
        RELATORIO_DISPONIVEL: 'Relatório Disponível',
        ERRO_PROCESSAMENTO: 'Erro no Processamento',
        ARQUIVADA: 'Arquivada'
    };
    return mapa[estado] || estado || '—';
}

const totalMonografias = computed(() => total.value || items.value.length);
const submetidasMonografias = computed(() => items.value.filter(m => m.estado === 'SUBMETIDA').length);
const analisadasMonografias = computed(() => items.value.filter(m => m.estado === 'ANALISADA' || m.estado === 'RELATORIO_DISPONIVEL').length);

const monografiasFiltradas = computed(() => {
    const termo = search.value.trim().toLowerCase();
    return items.value.filter((m) => {
        const matchBusca = !termo || [
            m.titulo,
            m.estudante_nome,
            m.orientador_nome,
            m.ano
        ].some(v => String(v ?? '').toLowerCase().includes(termo));

        const matchEstado = !estadoFiltro.value || m.estado === estadoFiltro.value;
        return matchBusca && matchEstado;
    });
});

const podeSubmeter = computed(() => role.value === 'ESTUDANTE' || utilizadorLogado.value?.role_nome === 'ESTUDANTE');
const podeGerir = computed(() => role.value === 'ADMIN' || utilizadorLogado.value?.role_nome === 'ADMIN');

onMounted(async () => {
    await carregarDados();
    await carregarVinculosEstudante();
});

async function carregarDados() {
    loading.value = true;
    error.value = null;
    try {
        const resposta = await listar({ search: '', estado: '' });
        items.value = extrairLista(resposta);
        total.value = resposta?.total || items.value.length;

        if (utilizadorLogado.value?.id) {
            await listarNotificacoes();
        }
    } catch (err) {
        error.value = err.message || 'Erro ao carregar dados.';
        toast.add({ severity: 'error', summary: 'Erro', detail: error.value, life: 5000 });
    } finally {
        loading.value = false;
    }
}

/* Busca do Curso e Orientador cadastrados previamente para este Estudante */
/* Busca do Curso e Orientador cadastrados diretamente através das Orientações */
async function carregarVinculosEstudante() {
    if (!utilizadorLogado.value?.id) return;

    try {
        // 1. Procura as orientações do sistema
        const respOri = await listarOrientacoes({});
        const listaOri = extrairLista(respOri);

        if (listaOri.length > 0) {
            // Procura a orientação correspondente ao utilizador logado ou pega a orientação ativa
            const orientacaoEstudante = listaOri.find(
                (o) => o.utilizador_id === utilizadorLogado.value.id || 
                       o.estudante_email === utilizadorLogado.value.email ||
                       o.estado === 'ATIVA'
            ) || listaOri[0];

            if (orientacaoEstudante) {
                // Preenche o ID do Estudante
                dadosEstudanteVinculados.estudante_id = orientacaoEstudante.estudante_id;

                // Preenche o Curso diretamente da resposta da orientação
                dadosEstudanteVinculados.curso_id = orientacaoEstudante.curso_id;
                dadosEstudanteVinculados.curso_nome = orientacaoEstudante.curso_nome || 'Não especificado';

                // Preenche o Docente Orientador diretamente da resposta
                dadosEstudanteVinculados.orientador_id = orientacaoEstudante.docente_id;
                dadosEstudanteVinculados.orientador_nome = orientacaoEstudante.docente_nome || 'Nenhum orientador atribuído';
            }
        } else {
            dadosEstudanteVinculados.curso_nome = 'Nenhum curso associado';
            dadosEstudanteVinculados.orientador_nome = 'Nenhum orientador atribuído';
        }
    } catch (err) {
        console.warn('Erro ao carregar dados vinculados da orientação:', err);
        dadosEstudanteVinculados.curso_nome = 'Não associado';
        dadosEstudanteVinculados.orientador_nome = 'Não atribuído';
    }
}

function abrirSubmissao() {
    Object.assign(form, {
        estudante_id: dadosEstudanteVinculados.estudante_id || utilizadorLogado.value?.id || '',
        orientador_id: dadosEstudanteVinculados.orientador_id || '',
        curso_id: dadosEstudanteVinculados.curso_id || '',
        titulo: '',
        ano: new Date().getFullYear(),
        descricao: '',
        ficheiro: null
    });
    showForm.value = true;
}

function handleSelectFile(event) {
    const ficheiro = event.files[0];
    if (ficheiro) {
        form.ficheiro = ficheiro;
    }
}

function removerFicheiro() {
    form.ficheiro = null;
}

async function handleSubmit() {
    if (!form.titulo || !form.ficheiro) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha o título e anexe o documento do trabalho.', life: 4000 });
        return;
    }

    saving.value = true;
    try {
        const fd = new FormData();
        fd.append('titulo', form.titulo.trim());
        fd.append('ano', form.ano);
        fd.append('descricao', form.descricao?.trim() || '');
        fd.append('estudante_id', form.estudante_id);
        if (form.curso_id) fd.append('curso_id', form.curso_id);
        if (form.orientador_id) fd.append('orientador_id', form.orientador_id);
        fd.append('ficheiro', form.ficheiro);

        const resposta = await submeter(fd);
        if (operacaoBemSucedida(resposta)) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Monografia submetida com sucesso.', life: 4000 });
            showForm.value = false;
            await carregarDados();
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(resposta, 'Erro ao submeter.'), life: 5000 });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(err?.response ?? err, 'Erro ao enviar monografia.'), life: 5000 });
    } finally {
        saving.value = false;
    }
}

async function verVersoes(monografia) {
    monografiaSelecionada.value = monografia;
    try {
        const respVersoes = await carregarVersoes(monografia.id);
        versoes.value = extrairLista(respVersoes);
    } catch (err) {
        versoes.value = [];
    }
    showVersoes.value = true;
}

async function handleVersaoUpload(event) {
    const arquivo = event.files[0];
    if (!arquivo) return;

    saving.value = true;
    try {
        const fd = new FormData();
        fd.append('ficheiro', arquivo);
        const resposta = await submeterVersao(monografiaSelecionada.value.id, fd);

        if (operacaoBemSucedida(resposta)) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Nova versão submetida.', life: 4000 });
            showVersoes.value = false;
            await carregarDados();
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(resposta, 'Erro ao enviar nova versão.'), life: 5000 });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(err?.response ?? err, 'Erro ao submeter versão.'), life: 5000 });
    } finally {
        saving.value = false;
    }
}

function confirmarArquivamento(id) {
    confirm.require({
        message: 'Tem a certeza de que deseja arquivar esta monografia?',
        header: 'Confirmar arquivamento',
        icon: 'pi pi-exclamation-triangle',
        rejectLabel: 'Cancelar',
        acceptLabel: 'Arquivar',
        acceptClass: 'p-button-danger',
        accept: () => arquivarMonografia(id)
    });
}

async function arquivarMonografia(id) {
    try {
        await arquivar(id);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Monografia arquivada.', life: 4000 });
        await carregarDados();
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao arquivar monografia.', life: 5000 });
    }
}
</script>

<template>
    <Toast />
    <ConfirmDialog />

    <div class="monografias-page">
        <!-- Cabeçalho Principal -->
        <div class="page-header">
            <div>
                <h1>Gestão de Monografias</h1>
                <p>Submeta e acompanhe os trabalhos submetidos para análise de similaridade.</p>
            </div>
            <Button v-if="podeSubmeter || podeGerir" label="Submeter Monografia" icon="pi pi-plus" class="btn-primary-custom" @click="abrirSubmissao" />
        </div>

        <!-- Cartões de Estatísticas -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon-wrapper bg-blue-50 text-blue-600">
                    <i class="pi pi-file text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Total de Monografias</span>
                    <h3 class="stat-value">{{ totalMonografias }}</h3>
                    <span class="stat-trend text-blue-600">Registadas</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrapper bg-amber-50 text-amber-600">
                    <i class="pi pi-clock text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Recém Submetidas</span>
                    <h3 class="stat-value">{{ submetidasMonografias }}</h3>
                    <span class="stat-trend text-amber-600">Submetidas</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrapper bg-emerald-50 text-emerald-600">
                    <i class="pi pi-check-circle text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Analisadas / Concluídas</span>
                    <h3 class="stat-value">{{ analisadasMonografias }}</h3>
                    <span class="stat-trend text-emerald-600">Processadas</span>
                </div>
            </div>
        </div>

        <!-- Barra de Ferramentas e Filtros -->
        <div class="toolbar-card">
            <div class="search-wrapper">
                <InputText v-model="search" placeholder="Pesquisar por título, estudante ou orientador..." class="search-input" />
            </div>
            
            <div class="filters-group">
                <Dropdown v-model="estadoFiltro" :options="[
                    { label: 'Todos os Estados', value: '' },
                    { label: 'Submetida', value: 'SUBMETIDA' },
                    { label: 'Aguardando Análise', value: 'AGUARDANDO_ANALISE' },
                    { label: 'Em Análise', value: 'EM_ANALISE' },
                    { label: 'Analisada', value: 'ANALISADA' },
                    { label: 'Relatório Disponível', value: 'RELATORIO_DISPONIVEL' },
                    { label: 'Erro', value: 'ERRO_PROCESSAMENTO' },
                    { label: 'Arquivada', value: 'ARQUIVADA' }
                ]" optionLabel="label" optionValue="value" placeholder="Filtrar por Estado" class="w-48" />

                <Button icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="carregarDados" v-tooltip.top="'Atualizar lista'" />
            </div>
        </div>

        <!-- Tabela de Monografias -->
        <DataTable :value="monografiasFiltradas" :loading="loading" dataKey="id" paginator :rows="10"
            :rowsPerPageOptions="[5, 10, 20, 50]" stripedRows responsiveLayout="scroll"
            class="p-datatable-custom shadow-sm border rounded-xl overflow-hidden"
            emptyMessage="Nenhuma monografia encontrada.">
            
            <Column field="titulo" header="Título do Trabalho" sortable style="min-width: 16rem;">
                <template #body="{ data }">
                    <strong>{{ data.titulo }}</strong>
                </template>
            </Column>

            <Column field="estudante_nome" header="Estudante" sortable style="min-width: 12rem;">
                <template #body="{ data }">
                    <span>{{ data.estudante_nome || '—' }}</span>
                </template>
            </Column>

            <Column field="orientador_nome" header="Orientador" sortable style="min-width: 12rem;">
                <template #body="{ data }">
                    <span>{{ data.orientador_nome || '—' }}</span>
                </template>
            </Column>

            <Column field="ano" header="Ano" sortable style="min-width: 7rem;" />

            <Column field="estado" header="Estado" style="width: 11rem;">
                <template #body="{ data }">
                    <Tag :value="rotuloEstado(data.estado)" :severity="severityEstado(data.estado)" />
                </template>
            </Column>

            <Column field="criado_em" header="Submetido em" sortable style="min-width: 10rem;">
                <template #body="{ data }">
                    <span>{{ formatarData(data.criado_em) }}</span>
                </template>
            </Column>

            <Column header="Ações" style="width: 8rem; text-align: center;">
                <template #body="{ data }">
                    <div class="action-buttons">
                        <Button icon="pi pi-eye" severity="info" text rounded aria-label="Ver Versões"
                            v-tooltip.top="'Ver histórico e versões'" @click="verVersoes(data)" />
                        <Button v-if="podeGerir && data.estado !== 'ARQUIVADA'" icon="pi pi-trash" severity="danger" text rounded aria-label="Arquivar"
                            v-tooltip.top="'Arquivar monografia'" @click="confirmarArquivamento(data.id)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Diálogo de Submissão Limpo com Dados Automáticos Fixos -->
        <Dialog v-model:visible="showForm" header="Submeter Monografia" modal
            :style="{ width: 'min(95vw, 620px)' }" :closable="!saving">
            <form class="monografia-form" @submit.prevent="handleSubmit">
                
                <!-- Bloco de Informações Cadastrais Automáticas (Somente Leitura) -->
                <div class="info-auto-card border rounded-xl p-4 bg-slate-50 border-slate-200">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                            <span class="text-xs text-slate-500 font-medium block">Estudante</span>
                            <strong class="text-slate-800">{{ utilizadorLogado?.nome_completo || '—' }}</strong>
                        </div>
                        <div>
                            <span class="text-xs text-slate-500 font-medium block">Curso Vinculado</span>
                            <strong class="text-slate-800">{{ dadosEstudanteVinculados.curso_nome }}</strong>
                        </div>
                        <div class="md:col-span-2">
                            <span class="text-xs text-slate-500 font-medium block">Orientador Atribuído</span>
                            <strong class="text-slate-800">{{ dadosEstudanteVinculados.orientador_nome }}</strong>
                        </div>
                    </div>
                </div>

                <div class="field">
                    <label for="titulo">Título da Monografia *</label>
                    <InputText id="titulo" v-model="form.titulo" class="w-full form-input"
                        placeholder="Ex: Sistema Inteligente de Análise de Similaridade" />
                </div>

                <div class="field">
                    <label for="ano">Ano de Submissão *</label>
                    <InputNumber id="ano" v-model="form.ano" :useGrouping="false" class="w-full form-input"
                        placeholder="Ex: 2026" />
                </div>

                <div class="field">
                    <label for="descricao">Resumo / Descrição</label>
                    <Textarea id="descricao" v-model="form.descricao" rows="3" class="w-full"
                        placeholder="Breve introdução ou resumo do trabalho (opcional)" />
                </div>

                <!-- Seleção e Preview do Documento -->
                <div class="field">
                    <label>Ficheiro do Trabalho (.pdf, .doc, .docx) *</label>
                    
                    <div v-if="!form.ficheiro" class="upload-dropzone border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 cursor-pointer transition-colors">
                        <i class="pi pi-cloud-upload text-3xl text-slate-400 mb-2"></i>
                        <FileUpload mode="basic" chooseLabel="Selecionar Documento" accept=".pdf,.doc,.docx"
                            class="w-full" @select="handleSelectFile" />
                        <span class="upload-hint block mt-2">Formatos permitidos: PDF, DOC, DOCX</span>
                    </div>

                    <!-- Cartão de Preview do Ficheiro -->
                    <div v-else class="file-preview-card border rounded-xl p-3 bg-blue-50 border-blue-200 flex items-center justify-between">
                        <div class="file-preview-info flex items-center gap-3">
                            <i class="pi pi-file-pdf text-red-500 text-2xl"></i>
                            <div>
                                <strong class="file-name block text-slate-800 text-sm font-semibold">{{ form.ficheiro.name }}</strong>
                                <span class="file-size text-xs text-slate-500">{{ (form.ficheiro.size / (1024 * 1024)).toFixed(2) }} MB</span>
                            </div>
                        </div>
                        <Button icon="pi pi-trash" severity="danger" text rounded v-tooltip.top="'Remover ficheiro'" @click="removerFicheiro" />
                    </div>
                </div>

                <div class="form-actions">
                    <Button type="button" label="Cancelar" severity="secondary" outlined :disabled="saving"
                        @click="showForm = false" />
                    <Button type="submit" label="Submeter Monografia" icon="pi pi-paper-plane"
                        :loading="saving" class="btn-primary-custom" />
                </div>
            </form>
        </Dialog>

        <!-- Diálogo de Histórico e Versões -->
        <Dialog v-model:visible="showVersoes" :header="`Histórico de Versões`" modal
            :style="{ width: 'min(95vw, 750px)' }">
            <div class="flex flex-col gap-4">
                <div class="upload-versao-box border rounded-xl p-4 bg-slate-50 border-slate-200">
                    <label class="block font-medium text-slate-700 mb-2">Enviar Nova Versão do Trabalho</label>
                    <FileUpload mode="basic" customUpload chooseLabel="Anexar Nova Versão" accept=".pdf,.doc,.docx"
                        :auto="true" @select="handleVersaoUpload" />
                </div>

                <DataTable :value="versoes" dataKey="id" paginator :rows="5" stripedRows responsiveLayout="scroll"
                    class="p-datatable-custom border rounded-lg overflow-hidden" emptyMessage="Nenhuma versão registada.">
                    <Column field="numero_versao" header="Versão" style="width: 6rem;">
                        <template #body="{ data }">
                            <Tag severity="info" :value="`v${data.numero_versao}`" rounded />
                        </template>
                    </Column>
                    <Column field="nome_original" header="Ficheiro" style="min-width: 14rem;" />
                    <Column field="estado" header="Estado" style="width: 10rem;">
                        <template #body="{ data }">
                            <Tag :value="rotuloEstado(data.estado)" :severity="severityEstado(data.estado)" />
                        </template>
                    </Column>
                    <Column field="criado_em" header="Submetido em" style="min-width: 10rem;">
                        <template #body="{ data }">
                            <span>{{ formatarData(data.criado_em) }}</span>
                        </template>
                    </Column>
                </DataTable>
            </div>

            <template #footer>
                <Button label="Fechar" severity="secondary" outlined @click="showVersoes = false" />
            </template>
        </Dialog>

        <div v-if="error" class="p-3 text-red-500 bg-red-50 rounded mt-4 border border-red-200">Erro: {{ error }}</div>
    </div>
</template>

<style scoped>
.monografias-page {
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

.monografia-form {
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

.upload-hint {
    font-size: 0.75rem;
    color: #64748b;
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