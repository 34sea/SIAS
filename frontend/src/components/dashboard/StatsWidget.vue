<template>
  <div class="col-span-12 lg:col-span-6 xl:col-span-3">
      <div class="card mb-0">
          <div class="flex justify-between mb-4">
              <div>
                  <span class="block text-muted-color font-medium mb-4">Rostos Cadastrados</span>
                  <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ totalRostos }}</div>
              </div>
              <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                  <i class="pi pi-address-book text-blue-500 !text-xl"></i>
              </div>
          </div>
          <span class="text-muted-color">Total de indivíduos armazenados</span>
      </div>
  </div>

  <div class="col-span-12 lg:col-span-6 xl:col-span-3">
      <div class="card mb-0">
          <div class="flex justify-between mb-4">
              <div>
                  <span class="block text-muted-color font-medium mb-4">Usuários</span>
                  <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ totalUsuarios }}</div>
              </div>
              <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                  <i class="pi pi-user text-orange-500 !text-xl"></i>
              </div>
          </div>
          <span class="text-muted-color">Quant. de usuários no sistema</span>
      </div>
  </div>

  <div class="col-span-12 lg:col-span-6 xl:col-span-3">
      <div class="card mb-0">
          <div class="flex justify-between mb-4">
              <div>
                  <span class="block text-muted-color font-medium mb-4">Registros Armazenados</span>
                  <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ totalImagens }}</div>
              </div>
              <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                  <i class="pi pi-image text-cyan-500 !text-xl"></i>
              </div>
          </div>
          <span class="text-muted-color">Total de imagens (Dataset)</span>
      </div>
  </div>

  <div class="col-span-12 lg:col-span-6 xl:col-span-3">
      <div class="card mb-0">
          <div class="flex justify-between mb-4">
              <div>
                  <span class="block text-muted-color font-medium mb-4">Detetados</span>
                  <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ totalDeteccoes }}</div>
              </div>
              <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                  <i class="pi pi-bell text-purple-500 !text-xl"></i>
              </div>
          </div>
          <span class="text-muted-color">Detetados com sucesso</span>
      </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

// Reactive variables para os cards
const totalRostos = ref(0)
const totalUsuarios = ref(0)
const totalImagens = ref(0)
const totalDeteccoes = ref(0)


async function fetchDashboardCards() {
    try {
        const res = await axios.get('http://localhost:8000/dashboard/cards')
        totalRostos.value = res.data.total_rostos
        totalUsuarios.value = res.data.total_usuarios
        totalImagens.value = res.data.total_imagens
        totalDeteccoes.value = res.data.total_deteccoes
    } catch (err) {
        console.error("Erro ao buscar dados do dashboard:", err)
    }
}


onMounted(() => {
    fetchDashboardCards()
})
</script>