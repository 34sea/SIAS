<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { estudanteService } from '@/services/estudanteService';
import { cursoService } from '@/services/cursoService';
import { usersApi } from '@/api/users';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';
import Checkbox from 'primevue/checkbox';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';

const API_URL = 'http://localhost:5000/';
const toast = useToast();
const confirm = useConfirm();

const estudantes = ref([]);
const cursos = ref([]);
const utilizadores = ref([]);
const loading = ref(false);
const saving = ref(false);
const error = ref(null);
const search = ref('');

const form = reactive({ 
    id: null, 
    utilizador_id: '', 
    curso_id: '', 
    numero_estudante: '', 
    ano_ingresso: '', 
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
    console.log(resposta)
    console.log(resposta.success)
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
    if (Array.isArray(corpo?.estudantes)) return corpo.estudantes;
    if (Array.isArray(corpo?.cursos)) return corpo.cursos;
    if (Array.isArray(corpo?.utilizadores)) return corpo.utilizadores;
    return [];
}

// Estatísticas Computadas corrigidas
const totalEstudantes = computed(() => estudantes.value.length);
const ativosEstudantes = computed(() => estudantes.value.filter(e => Number(e.ativo) === 1 || e.ativo === true).length);
const inativosEstudantes = computed(() => totalEstudantes.value - ativosEstudantes.value);

const estudantesFiltrados = computed(() => {
    const termo = search.value.trim().toLowerCase();
    if (!termo) return estudantes.value;

    return estudantes.value.filter((e) => {
        return [
            e.nome_completo,
            e.email,
            e.curso_nome,
            e.numero_estudante,
            e.ano_ingresso
        ].some((valor) => String(valor ?? '').toLowerCase().includes(termo));
    });
});

onMounted(async () => {
    await carregarDados();
});

async function carregarDados() {
    loading.value = true;
    try {
        const [respEstudantes, respCursos] = await Promise.all([
            estudanteService.listar({}),
            cursoService.listar({})
        ]);

        estudantes.value = extrairLista(respEstudantes);
        cursos.value = extrairLista(respCursos);
        await carregarUtilizadores();
    } catch (err) {
        error.value = err.message || 'Erro ao carregar dados.';
        toast.add({ severity: 'error', summary: 'Erro', detail: error.value, life: 5000 });
    } finally {
        loading.value = false;
    }
}

async function carregarUtilizadores() {
    try {
        const resposta = await usersApi.list();
        const data = extrairLista(resposta);
        
        utilizadores.value = data.filter(u => {
            const roleName = (u.role_nome || u.role?.nome || '').toUpperCase();
            return roleName === 'ESTUDANTE';
        });
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
        ativo: Number(item.ativo) === 1 || item.ativo === true
    });
    modoEdicao.value = true;
    showForm.value = true;
}

async function salvar() {
    if (!form.utilizador_id || !form.curso_id) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Utilizador e curso são obrigatórios.', life: 4000 });
        return;
    }

    saving.value = true;
    try {
        const payload = {
            utilizador_id: form.utilizador_id,
            curso_id: form.curso_id,
            numero_estudante: form.numero_estudante?.trim() || null,
            ano_ingresso: form.ano_ingresso ? Number(form.ano_ingresso) : null,
            ativo: form.ativo ? 1 : 0
        };

        const resposta = modoEdicao.value
            ? await estudanteService.actualizar(form.id, payload)
            : await estudanteService.criar(payload);

        if (operacaoBemSucedida(resposta)) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: modoEdicao.value ? 'Estudante actualizado.' : 'Estudante registado.', life: 4000 });
            showForm.value = false;
            
            const respEstudantes = await estudanteService.listar({});
            estudantes.value = extrairLista(respEstudantes);
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(resposta, 'A API não confirmou a operação.'), life: 5000 });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(err?.response ?? err, 'Erro ao guardar estudante.'), life: 5000 });
    } finally {
        saving.value = false;
    }
}

function confirmarRemocao(item) {
    confirm.require({
        message: `Tem a certeza de que deseja eliminar o estudante "${item.nome_completo}"?`,
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
        const resposta = await estudanteService.eliminar(id);
        if (operacaoBemSucedida(resposta)) {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Estudante eliminado.', life: 4000 });
            const respEstudantes = await estudanteService.listar({});
            estudantes.value = extrairLista(respEstudantes);
        } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(resposta, 'Erro ao eliminar.'), life: 5000 });
        }
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: mensagemErro(err?.response ?? err, 'Erro ao eliminar estudante.'), life: 5000 });
    }
}
</script>

<template>
    <Toast />
    <ConfirmDialog />

    <div class="estudantes-page">
        <!-- Cabeçalho Principal -->
        <div class="page-header">
            <div>
                <h1>Gestão de Estudantes</h1>
                <p>Registe e administre os estudantes que submetem monografias no sistema.</p>
            </div>
            <Button label="Adicionar Novo Estudante" icon="pi pi-plus" class="btn-primary-custom" @click="abrirNovo" />
        </div>

        <!-- Cartões de Estatísticas -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon-wrapper bg-blue-50 text-blue-600">
                    <i class="pi pi-users text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Total de Estudantes</span>
                    <h3 class="stat-value">{{ totalEstudantes }}</h3>
                    <span class="stat-trend text-blue-600">Registados</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrapper bg-emerald-50 text-emerald-600">
                    <i class="pi pi-user text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Estudantes Ativos</span>
                    <h3 class="stat-value">{{ ativosEstudantes }}</h3>
                    <span class="stat-trend text-emerald-600">Ativos</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrapper bg-red-50 text-red-600">
                    <i class="pi pi-user-minus text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Estudantes Inativos</span>
                    <h3 class="stat-value">{{ inativosEstudantes }}</h3>
                    <span class="stat-trend text-red-600">Inativos</span>
                </div>
            </div>
        </div>

        <!-- Barra de Ferramentas e Filtros -->
        <div class="toolbar-card">
            <div class="search-wrapper">
                <InputText v-model="search" placeholder="Pesquisar por nome, email, curso ou nº de estudante..." class="search-input" />
            </div>
            
            <div class="filters-group">
                <Button icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="carregarDados" v-tooltip.top="'Atualizar lista'" />
            </div>
        </div>

        <!-- Tabela de Estudantes com Foto -->
        <DataTable :value="estudantesFiltrados" :loading="loading" dataKey="id" paginator :rows="10"
            :rowsPerPageOptions="[5, 10, 20, 50]" stripedRows responsiveLayout="scroll"
            class="p-datatable-custom shadow-sm border rounded-xl overflow-hidden"
            emptyMessage="Nenhum estudante encontrado.">
            
            <Column field="nome_completo" header="Estudante" sortable style="min-width: 15rem;">
                <template #body="{ data }">
                    <div class="user-cell">
                        <img v-if="data.foto" :src="data.foto.startsWith('http') ? data.foto : `${API_URL}${data.foto}`"
                            alt="Fotografia" class="user-avatar" />
                        <div v-else class="user-avatar avatar-placeholder">
                            <i class="pi pi-user" />
                        </div>
                        <div>
                            <strong>{{ data.nome_completo }}</strong>
                            <small>{{ data.username }}</small>
                        </div>
                    </div>
                </template>
            </Column>

            <Column field="email" header="Email" sortable style="min-width: 13rem;" />

            <Column field="curso_nome" header="Curso" sortable style="min-width: 12rem;">
                <template #body="{ data }">
                    <Tag severity="info" :value="data.curso_nome || '—'" rounded />
                </template>
            </Column>

            <Column field="numero_estudante" header="Nº Estudante" style="min-width: 9rem;" />

            <Column field="ano_ingresso" header="Ano Ingresso" style="min-width: 8rem;" />

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
                            v-tooltip.top="'Editar estudante'" @click="editar(data)" />
                        <Button icon="pi pi-trash" severity="danger" text rounded aria-label="Remover"
                            v-tooltip.top="'Remover estudante'" @click="confirmarRemocao(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- Diálogo de Criação / Edição -->
        <Dialog v-model:visible="showForm" :header="modoEdicao ? 'Editar Estudante' : 'Adicionar Novo Estudante'" modal
            :style="{ width: 'min(95vw, 580px)' }" :closable="!saving">
            <form class="student-form" @submit.prevent="salvar">
                
                <div class="field">
                    <label for="utilizador_id">Utilizador do Sistema *</label>
                    <Dropdown id="utilizador_id" v-model="form.utilizador_id" 
                        :options="utilizadores.map(u => ({ label: `${u.nome_completo} (${u.email})`, value: u.id }))" 
                        optionLabel="label" optionValue="value" placeholder="Selecione um utilizador" class="w-full" filter />
                </div>

                <div class="field">
                    <label for="curso_id">Curso *</label>
                    <Dropdown id="curso_id" v-model="form.curso_id" 
                        :options="Array.isArray(cursos) ? cursos.map(c => ({ label: c.nome, value: c.id })) : []" 
                        optionLabel="label" optionValue="value" placeholder="Selecione o curso" class="w-full" />
                </div>

                <div class="field">
                    <label for="numero_estudante">Nº Estudante</label>
                    <InputText id="numero_estudante" v-model="form.numero_estudante" class="w-full form-input"
                        placeholder="Ex: 20230123" />
                </div>

                <div class="field">
                    <label for="ano_ingresso">Ano de Ingresso</label>
                    <InputText id="ano_ingresso" v-model="form.ano_ingresso" type="number" class="w-full form-input"
                        placeholder="Ex: 2023" />
                </div>

                <div class="field checkbox-field">
                    <Checkbox v-model="form.ativo" :binary="true" inputId="ativo" />
                    <label for="ativo">Estudante ativo</label>
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
.estudantes-page {
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

.user-cell {
    display: flex;
    align-items: center;
    gap: 0.85rem;
}

.user-cell strong,
.user-cell small {
    display: block;
}

.user-cell strong {
    color: #1e293b;
    font-size: 0.95rem;
}

.user-cell small {
    margin-top: 0.2rem;
    color: #64748b;
}

.user-avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #e2e8f0;
}

.avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1f5f9;
    color: #64748b;
}

.action-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
}

.student-form {
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