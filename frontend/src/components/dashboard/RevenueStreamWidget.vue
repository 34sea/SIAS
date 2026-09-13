<script setup>
import { useLayout } from '@/layout/composables/layout';
import { onMounted, ref, watch } from 'vue';
import axios from 'axios';

const { getPrimary, getSurface, isDarkTheme } = useLayout();

const chartData = ref(null);
const chartOptions = ref(null);

function setChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const borderColor = documentStyle.getPropertyValue('--surface-border');
    const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');

    return {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        scales: {
            x: {
                stacked: false,
                ticks: { color: textMutedColor },
                grid: { color: 'transparent', borderColor: 'transparent' },
                // Ajuste para mostrar barras lado a lado
                categoryPercentage: 0.6, 
                barPercentage: 0.9
            },
            y: {
                stacked: false,
                ticks: { color: textMutedColor },
                grid: { color: borderColor, borderColor: 'transparent', drawTicks: false }
            }
        }
    };
}

async function fetchChartData() {
    try {
        const res = await axios.get('http://localhost:8000/dashboard/graphs'); 
        const documentStyle = getComputedStyle(document.documentElement);

        const colors = [
            documentStyle.getPropertyValue('--p-primary-400'), 
            documentStyle.getPropertyValue('--p-blue-400')   
        ];

        chartData.value = {
            labels: res.data.labels,
            datasets: res.data.datasets.map((dataset, idx) => ({
                type: 'bar',
                label: dataset.label,
                data: dataset.data,
                backgroundColor: colors[idx] || '#888',
                barThickness: 20, 
                order: idx + 1     
            }))
        };
    } catch (err) {
        console.error("Erro ao buscar dados do gráfico:", err);
    }
}

watch([getPrimary, getSurface, isDarkTheme], () => {
    chartOptions.value = setChartOptions();
    fetchChartData();
});

onMounted(() => {
    chartOptions.value = setChartOptions();
    fetchChartData();
});
</script>

<template>
    <div class="card" style="border: 0px solid black; width: 100%;">
        <div class="font-semibold text-xl mb-4">Total de rostos detectados por mês</div>
        <Chart type="bar" :data="chartData" :options="chartOptions" class="h-80" />
    </div>
</template>