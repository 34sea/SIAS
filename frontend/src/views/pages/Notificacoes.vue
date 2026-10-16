<script setup>
import { ref, onMounted } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useNotificacoes } from '@/composables/useNotificacoes';
import { useToast } from 'primevue/usetoast';

const { user } = useAuth();
const { listar, marcarLida, items, loading, error } = useNotificacoes(user.value?.id);
const toast = useToast();

onMounted(() => listar());

async function ler(id) {
    await marcarLida(id);
    toast.add({ severity: 'info', summary: 'Notificação', detail: 'Marcada como lida.' });
}

</script>

<template>
    <div class="notificacoes-page">
        <Toast />
        <div class="page-header">
            <h1 class="text-2xl font-bold text-sias-800">Notificações</h1>
            <p class="text-sias-600">Acompanhe os alertas do sistema (submissões, análises, relatórios).</p>
        </div>

        <Card class="mt-4">
            <DataTable :value="items" :paginator="true" :rows="10" dataKey="id" :loading="loading" emptyMessage="Sem notificações.">
                <template #header>
                    <span>Notificações ({{ items.value.length }})</span>
                </template>
                <Column field="tipo" header="Tipo" sortable />
                <Column field="titulo" header="Título" sortable />
                <Column field="mensagem" header="Mensagem" />
                <Column field="lida" header="Lida">
                    <template #body="slotProps">
                        <span :class="slotProps.data.lida ? 'badge-ativo' : 'badge-inativo'">
                            {{ slotProps.data.lida ? 'Lida' : 'Não lida' }}
                        </span>
                    </template>
                </Column>
                <Column field="criado_em" header="Data" />
                <Column field="acao" header="Ação" style="width: 120px; text-align: center">
                    <template #body="slotProps">
                        <Button v-if="!slotProps.data.lida" icon="pi pi-check" outlined rounded @click="ler(slotProps.data.id)" />
                    </template>
                </Column>
            </DataTable>
        </Card>

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
</style>
