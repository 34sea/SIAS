<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useMonografias } from '@/composables/useMonografias';
import { useAuth } from '@/composables/useAuth';
import { useNotificacoes } from '@/composables/useNotificacoes';
import { useCursos } from '@/composables/useCursos';
import { useToast } from 'primevue/usetoast';

const { listar, obter, submeter, carregarVersoes, submeterVersao, arquivar, items, total, loading, item, versoes, error } =
    useMonografias();

const { isAuthenticated, role, user, logout } = useAuth();
const { listar: listarNotificacoes } = useNotificacoes(user.value?.id);
const { listar: listarCursos, items: cursosItems } = useCursos();

const toast = useToast();

const form = reactive({
    estudante_id: '',
    orientador_id: '',
    curso_id: '',
    titulo: '',
    ano: new Date().getFullYear(),
    descricao: '',
    ficheiro: null,
});

const showForm = ref(false);
const showVersoes = ref(false);
const arquivoVersao = ref(null);
const monografiaSelecionada = ref(null);
const search = ref('');
const estadoFiltro = ref('');

const colunas = [
    { field: 'titulo', header: 'Título', sortable: true },
    { field: 'estudante_nome', header: 'Estudante', sortable: true },
    { field: 'orientador_nome', header: 'Orientador', sortable: true },
    { field: 'ano', header: 'Ano', sortable: true },
    { field: 'estado', header: 'Estado', sortable: true },
    { field: 'criado_em', header: 'Submetido em', sortable: true },
];

const monografiasFiltradas = computed(() =>
    items.value.filter((m) => {
        const matchBusca =
            !search.value ||
            m.titulo.toLowerCase().includes(search.value.toLowerCase()) ||
            m.estudante_nome.toLowerCase().includes(search.value.toLowerCase());
        const matchEstado = !estadoFiltro.value || m.estado === estadoFiltro.value;
        return matchBusca && matchEstado;
    })
);

onMounted(async () => {
    await listar({ search: '', estado: '' });
    await listarCursos();
    if (user.value) {
        await listarNotificacoes();
    }
});

async function abrirSubmissao() {
    form.estudante_id = user.value?.id || '';
    form.orientador_id = '';
    form.curso_id = '';
    form.titulo = '';
    form.ano = new Date().getFullYear();
    form.descricao = '';
    form.ficheiro = null;
    showForm.value = true;
}

async function handleSubmit() {
    if (!form.titulo || !form.ficheiro) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha o título e anexe o ficheiro.' });
        return;
    }
    const fd = new FormData();
    fd.append('titulo', form.titulo);
    fd.append('ano', form.ano);
    fd.append('descricao', form.descricao);
    fd.append('estudante_id', form.estudante_id);
    fd.append('orientador_id', form.orientador_id || '');
    fd.append('ficheiro', form.ficheiro);
    const resposta = await submeter(fd);
    if (resposta.success) {
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Monografia submetida com sucesso.' });
        showForm.value = false;
        await listar({ search: '', estado: '' });
    } else {
        toast.add({ severity: 'error', summary: 'Erro', detail: resposta.error });
    }
}

async function verVersoes(monografia) {
    monografiaSelecionada.value = monografia;
    await carregarVersoes(monografia.id);
    showVersoes.value = true;
}

async function handleVersaoUpload(event) {
    const arquivo = event.files[0];
    if (!arquivo) return;
    const fd = new FormData();
    fd.append('ficheiro', arquivo);
    const resposta = await submeterVersao(monografiaSelecionada.value.id, fd);
    if (resposta.success) {
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Nova versão submetida.' });
        showVersoes.value = false;
        await listar({ search: '', estado: '' });
    } else {
        toast.add({ severity: 'error', summary: 'Erro', detail: resposta.error });
    }
}

function confirmarArquivamento(id) {
    // Simples confirmação via toast para não depender de ConfirmationService configurado globalmente
    if (window.confirm('Tem certeza que deseja arquivar esta monografia?')) {
        arquivar(id).then(() => {
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Monografia arquivada.' });
            listar({ search: '', estado: '' });
        });
    }
}

const podeSubmeter = computed(() => role.value === 'ESTUDANTE');
const podeGerir = computed(() => role.value === 'ADMIN');

</script>

<template>
    <div class="monografias-page">
        <Toast />
        <ConfirmDialog />

        <div class="page-header">
            <h1 class="text-2xl font-bold text-sias-800">Monografias</h1>
            <p class="text-sias-600">Submeta e acompanhe as monografias de similaridade.</p>
        </div>

        <div class="toolbar">
            <div class="search-area">
                <InputText v-model="search.value" placeholder="Pesquisar por título ou estudante" />
                <Dropdown v-model="estadoFiltro.value" :options="[
                    { label: 'Todos', value: '' },
                    { label: 'Submetida', value: 'SUBMETIDA' },
                    { label: 'Aguardando Análise', value: 'AGUARDANDO_ANALISE' },
                    { label: 'Em Análise', value: 'EM_ANALISE' },
                    { label: 'Analisada', value: 'ANALISADA' },
                    { label: 'Relatório Disponível', value: 'RELATORIO_DISPONIVEL' },
                    { label: 'Erro', value: 'ERRO_PROCESSAMENTO' },
                    { label: 'Arquivada', value: 'ARQUIVADA' },
                ]" placeholder="Estado" />
            </div>
            <div class="actions">
                <Button v-if="podeSubmeter" label="Submeter Monografia" icon="pi pi-plus" outlined @click="abrirSubmissao" />
                <Button v-if="podeGerir" label="Nova" icon="pi pi-plus" @click="abrirSubmissao" />
            </div>
        </div>

        <Card class="mt-4">
            <DataTable :value="monografiasFiltradas" :paginator="true" :rows="10" dataKey="id" :loading="loading">
                <template #header>
                    <div class="flex justify-content-between align-items-center">
                        <span>Monografias ({{ total }})</span>
                    </div>
                </template>
                <Column v-for="coluna in colunas" :key="coluna.field" :field="coluna.field" :header="coluna.header" :sortable="coluna.sortable" />
                <Column field="acoes" header="Ações" style="width: 200px; text-align: center">
                    <template #body="slotProps">
                        <div class="flex justify-content-center gap-2">
                            <Button icon="pi pi-eye" outlined rounded @click="verVersoes(slotProps.data)" />
                            <Button v-if="podeGerir && slotProps.data.estado !== 'ARQUIVADA'" icon="pi pi-trash" outlined severity="danger" rounded @click="confirmarArquivamento(slotProps.data.id)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </Card>

        <!-- Dialog: Submeter monografia -->
        <Dialog v-model:visible="showForm" header="Submeter Monografia" :modal="true" style="width: 600px">
            <div class="flex flex-col gap-3">
                <InputText v-model="form.titulo" label="Título da Monografia" placeholder="Título do trabalho" />
                <InputNumber v-model="form.ano" label="Ano" :min="1900" :max="2100" />
                <Dropdown v-model="form.curso_id" label="Curso" :options="cursosItems.map(c => ({ label: c.nome, value: c.id }))" placeholder="Selecionar curso" />
                <Dropdown v-model="form.orientador_id" label="Orientador" :options="[]" placeholder="Orientador (opcional)" />
                <Textarea v-model="form.descricao" label="Descrição" :rows="3" />
                <FileUpload v-model="form.ficheiro" label="Anexar ficheiro (PDF ou Word)" accept=".pdf,.doc,.docx" chooseLabel="Selecionar ficheiro" />
            </div>
            <template #footer>
                <Button label="Cancelar" outlined @click="showForm = false" />
                <Button label="Submeter" icon="pi pi-paper-plane" @click="handleSubmit" />
            </template>
        </Dialog>

        <!-- Dialog: Versões -->
        <Dialog v-model:visible="showVersoes" :header="`Versões — ${monografiaSelecionada?.titulo}`" :modal="true" style="width: 700px">
            <div class="mb-4">
                <FileUpload v-model:files="arquivoVersao" label="Enviar nova versão" accept=".pdf,.doc,.docx" chooseLabel="Selecionar ficheiro" @upload="handleVersaoUpload" />
            </div>
            <DataTable :value="versoes" dataKey="id" :paginator="true" :rows="10">
                <Column field="numero_versao" header="Versão" />
                <Column field="nome_original" header="Ficheiro Original" />
                <Column field="estado" header="Estado" />
                <Column field="criado_em" header="Submetido em" />
            </DataTable>
            <template #footer>
                <Button label="Fechar" outlined @click="showVersoes = false" />
            </template>
        </Dialog>

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
.toolbar {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 1rem;
}
.search-area {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex: 1;
    min-width: 260px;
}
.actions {
    display: flex;
    gap: 0.5rem;
}
</style>
