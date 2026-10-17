<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useDashboard } from '@/composables/useDashboard';

import Card from 'primevue/card';
import Button from 'primevue/button';
import Chart from 'primevue/chart';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const toast = useToast();
const { stats, loading, error, carregar } = useDashboard();

onMounted(async () => {
    try {
        await carregar();
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar dados do dashboard.', life: 5000 });
    }
});

const formatoNumero = (valor) => Number(valor || 0).toLocaleString('pt-PT');

/* Configuração dos Gráficos com Chart.js */
const chartMonografiasData = computed(() => ({
    labels: ['Submetidas', 'Em Análise', 'Analisadas'],
    datasets: [
        {
            data: [
                stats.value.monografias_submetidas || 0,
                stats.value.monografias_analise || 0,
                stats.value.monografias_analisadas || 0
            ],
            backgroundColor: ['#3b82f6', '#f59e0b', '#10b981'],
            hoverBackgroundColor: ['#2563eb', '#d97706', '#059669']
        }
    ]
}));

const chartAnalisesData = computed(() => ({
    labels: ['Concluídas', 'Com Erro'],
    datasets: [
        {
            data: [
                stats.value.analises_concluidas || 0,
                stats.value.analises_erro || 0
            ],
            backgroundColor: ['#10b981', '#ef4444'],
            hoverBackgroundColor: ['#059669', '#dc2626']
        }
    ]
}));

const chartOptions = {
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                boxWidth: 12,
                font: { size: 12, family: 'inherit' }
            }
        }
    },
    responsive: true,
    maintainAspectRatio: false
};
</script>

<template>
    <Toast />

    <div class="dashboard-sias">
        <!-- Cabeçalho -->
        <div class="page-header">
            <div>
                <h1>Dashboard Administrativo</h1>
                <p>Visão geral e métricas do Sistema Inteligente para Análise de Similaridade.</p>
            </div>
            <Button label="Atualizar Dados" icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="carregar" />
        </div>

        <!-- Estatísticas Principais (Cards) -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon-wrapper bg-blue-50 text-blue-600">
                    <i class="pi pi-users text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Total de Estudantes</span>
                    <h3 class="stat-value">{{ formatoNumero(stats.total_estudantes) }}</h3>
                    <span class="stat-trend text-blue-600">Ativos no sistema</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrapper bg-indigo-50 text-indigo-600">
                    <i class="pi pi-id-card text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Total de Docentes</span>
                    <h3 class="stat-value">{{ formatoNumero(stats.total_docentes) }}</h3>
                    <span class="stat-trend text-indigo-600">Orientadores</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrapper bg-amber-50 text-amber-600">
                    <i class="pi pi-file text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Monografias Submetidas</span>
                    <h3 class="stat-value">{{ formatoNumero(stats.total_monografias) }}</h3>
                    <span class="stat-trend text-amber-600">Trabalhos</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon-wrapper bg-emerald-50 text-emerald-600">
                    <i class="pi pi-chart-bar text-xl"></i>
                </div>
                <div>
                    <span class="stat-label">Análises Concluídas</span>
                    <h3 class="stat-value">{{ formatoNumero(stats.analises_concluidas) }}</h3>
                    <span class="stat-trend text-emerald-600">Similares processadas</span>
                </div>
            </div>
        </div>

        <!-- Gráficos Analíticos -->
        <div class="charts-grid">
            <div class="chart-card">
                <div class="chart-header">
                    <h3>Estado das Monografias</h3>
                    <span class="text-xs text-secondary">Distribuição atual do fluxo</span>
                </div>
                <div class="chart-container">
                    <Chart type="doughnut" :data="chartMonografiasData" :options="chartOptions" class="h-full w-full" />
                </div>
            </div>

            <div class="chart-card">
                <div class="chart-header">
                    <h3>Estado das Análises</h3>
                    <span class="text-xs text-secondary">Taxa de sucesso e erros</span>
                </div>
                <div class="chart-container">
                    <Chart type="pie" :data="chartAnalisesData" :options="chartOptions" class="h-full w-full" />
                </div>
            </div>
        </div>

        <!-- Ações Rápidas de Gestão -->
        <div class="quick-actions-card">
            <h3>Atalhos Rápidos de Gestão</h3>
            <div class="actions-grid">
                <Button label="Gerir Cursos" icon="pi pi-book" class="p-button-outlined" @click="router.push('/cursos')" />
                <Button label="Gerir Docentes" icon="pi pi-id-card" class="p-button-outlined" @click="router.push('/docentes')" />
                <Button label="Gerir Estudantes" icon="pi pi-users" class="p-button-outlined" @click="router.push('/estudantes')" />
                <Button label="Gerir Monografias" icon="pi pi-file" class="p-button-outlined" @click="router.push('/monografias')" />
                <Button label="Análises" icon="pi pi-chart-bar" class="p-button-outlined" @click="router.push('/analises')" />
                <Button label="Relatórios" icon="pi pi-file-pdf" class="p-button-outlined" @click="router.push('/relatorios')" />
            </div>
        </div>

        <div v-if="error" class="p-3 text-red-500 bg-red-50 rounded mt-4 border border-red-200">Erro: {{ error }}</div>
    </div>
</template>

<style scoped>
.dashboard-sias {
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

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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

.charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
    gap: 1.5rem;
    margin-bottom: 1.5rem;
}

.chart-card {
    background: #ffffff;
    padding: 1.25rem;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.chart-header {
    margin-bottom: 1rem;
}

.chart-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
}

.text-secondary {
    color: #64748b;
}

.chart-container {
    height: 260px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
}

.quick-actions-card {
    background: #ffffff;
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.quick-actions-card h3 {
    margin: 0 0 1rem;
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
}

.actions-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}

@media (max-width: 768px) {
    .charts-grid {
        grid-template-columns: 1fr;
    }
    .page-header {
        flex-direction: column;
        align-items: stretch;
    }
}
</style>