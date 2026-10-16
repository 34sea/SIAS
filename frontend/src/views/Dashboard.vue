<script setup>
import { onMounted } from 'vue';
import { useDashboard } from '@/composables/useDashboard';

const { stats, loading, error, carregar } = useDashboard();

onMounted(() => {
    carregar();
});

const formatoNumero = (valor) => Number(valor || 0).toLocaleString('pt-PT');

</script>

<template>
    <div class="dashboard-sias">
        <h1 class="text-2xl font-bold mb-6 text-sias-800">Dashboard Administrativo — SIAS</h1>
        <p class="text-sias-600 mb-8">
            Visão geral do Sistema Inteligente para Análise de Similaridade.
        </p>

        <!-- Estatísticas -->
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            <Card class="stat-card">
                <div class="stat-label text-sias-500 font-medium">Total de Estudantes</div>
                <div class="stat-value text-3xl font-bold">{{ formatoNumero(stats.total_estudantes) }}</div>
            </Card>
            <Card class="stat-card">
                <div class="stat-label text-sias-500 font-medium">Total de Docentes</div>
                <div class="stat-value text-3xl font-bold">{{ formatoNumero(stats.total_docentes) }}</div>
            </Card>
            <Card class="stat-card">
                <div class="stat-label text-sias-500 font-medium">Monografias Submetidas</div>
                <div class="stat-value text-3xl font-bold">{{ formatoNumero(stats.total_monografias) }}</div>
            </Card>
            <Card class="stat-card">
                <div class="stat-label text-sias-500 font-medium">Documentos de Comparação</div>
                <div class="stat-value text-3xl font-bold">{{ formatoNumero(stats.total_documentos_comparacao) }}</div>
            </Card>
            <Card class="stat-card">
                <div class="stat-label text-sias-500 font-medium">Análises Concluídas</div>
                <div class="stat-value text-3xl font-bold">{{ formatoNumero(stats.analises_concluidas) }}</div>
            </Card>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card class="p-4">
                <div class="text-sias-500 font-medium mb-3">Estado das Monografias</div>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span>Submetidas</span>
                        <span class="font-bold">{{ formatoNumero(stats.monografias_submetidas) }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Em análise</span>
                        <span class="font-bold">{{ formatoNumero(stats.monografias_analise) }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Analisadas</span>
                        <span class="font-bold">{{ formatoNumero(stats.monografias_analisadas) }}</span>
                    </div>
                </div>
            </Card>

            <Card class="p-4">
                <div class="text-sias-500 font-medium mb-3">Estado das Análises</div>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span>Concluídas</span>
                        <span class="font-bold">{{ formatoNumero(stats.analises_concluidas) }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Com erro</span>
                        <span class="font-bold">{{ formatoNumero(stats.analises_erro) }}</span>
                    </div>
                </div>
            </Card>
        </div>

        <!-- Ações rápidas admin -->
        <Card class="mt-8 p-6">
            <div class="flex flex-wrap gap-3">
                <Button label="Gerir Cursos" icon="pi pi-book" to="/cursos" />
                <Button label="Gerir Docentes" icon="pi pi-user" to="/docentes" />
                <Button label="Gerir Estudantes" icon="pi pi-users" to="/estudantes" />
                <Button label="Gerir Monografias" icon="pi pi-file" to="/monografias" />
                <Button label="Análises" icon="pi pi-chart-bar" to="/analises" />
                <Button label="Relatórios" icon="pi pi-file-pdf" to="/relatorios" />
                <Button label="Documentos de Comparação" icon="pi pi-file" to="/documentos-comparacao" />
            </div>
        </Card>

        <div v-if="error" class="p-3 text-red-500 bg-red-50 rounded">Erro: {{ error }}</div>
    </div>
</template>

<style scoped>
.dashboard-sias {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem;
}
.stat-card {
    padding: 1.5rem !important;
    text-align: center;
}
.stat-label {
    font-size: 0.9rem;
}
.stat-value {
    margin-top: 0.5rem;
}
.text-sias-800 { color: #1e3a5f; }
.text-sias-600 { color: #3b5a7a; }
.text-sias-500 { color: #5a7aa0; }
</style>
