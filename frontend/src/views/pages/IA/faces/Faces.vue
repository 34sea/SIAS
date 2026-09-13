<script setup>
    import { ref, onMounted } from 'vue';
    import { getRostos } from '@/services/rostoService';
    
    const rostos = ref([]);
    const selectedRostos = ref();
    const dt = ref();
    
    const fetchRostos = async () => {
        rostos.value = await getRostos();
    };
    

    onMounted(() => {
        fetchRostos();
    });
    

    const getCategorySeverity = (categoria) => {
        switch (categoria) {
            case 'Suspeito':
                return 'danger';
            case 'Desaparecido':
                return 'warn';
            case 'Autorizado':
                return 'success';
            case 'Desconhecido':
                return 'info';
            default:
                return 'secondary';
        }
    };

    const base = 'http://127.0.0.1:8000/'
    </script>
    
    <template>
        <div class="card">
            <h1 class="text-2xl font-bold mb-4">Rostos</h1>
            <!-- <Toolbar class="mb-6">
                <template #start>
                    <Button label="New" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                    <Button label="Delete" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedProducts || !selectedProducts.length" />
                </template>

            </Toolbar> -->
            <DataTable ref="dt" v-model:selection="selectedRostos" :value="rostos" dataKey="id_rosto" :paginator="true" :rows="10">
                <!-- <Column selectionMode="multiple" style="width: 3rem"></Column> -->
                <Column field="id_rosto" header="ID" sortable></Column>
                <Column header="Rosto">
                    <template #body="slotProps">
                        <img :src="base+slotProps.data.imagem" alt="Rosto" class="rounded" style="width: 64px; height: 64px; object-fit: cover;" />
                    </template>
                </Column>
                <Column field="nome" header="Nome" sortable></Column>
                <Column header="Categoria" sortable>
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.categoria" :severity="getCategorySeverity(slotProps.data.categoria)" />
                    </template>
                </Column>
               
                <Column field="data" header="Data de Cadastro" sortable></Column>
                <Column :exportable="false" style="min-width: 1rem" header="Ações">
                    <template #body="slotProps">
                        <!-- <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editProduct(slotProps.data)" /> -->
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteProduct(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>
    </template>
    
    <style scoped>
    .card {
        padding: 2rem;
        background-color: var(--surface-card);
        border-radius: 12px;
    }
    </style>
    