<template>
  <div class="p-6 text-white min-h-screen">
    <h1 class="text-3xl font-bold mb-6">Monitoramento Facial</h1>
    <div class="card">
      <div style="width: 100%;">
        <h2 class="text-xl font-semibold mb-2">Câmera</h2>
        <img :src="streamSrc" alt="Stream da Câmera"  style="border: 0px solid red; width: 100%;" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const API_BASE = "http://localhost:8000";
const referencePreview = ref(null);
const streamSrc = ref(`${API_BASE}/video_feed`);

async function uploadReference(event) {
  const file = event.target.files[0];
  if (!file) return;

  referencePreview.value = URL.createObjectURL(file);
  const formData = new FormData();
  formData.append("reference", file);

  await fetch(`${API_BASE}/set_reference`, { method: "POST", body: formData });
}

async function clearReference() {
  await fetch(`${API_BASE}/clear_reference`);
  referencePreview.value = null;
}
</script>

<style scoped>
img {
  border-radius: 0.75rem;
  border: 1px solid #444;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

label,
button {
  transition: all 0.2s ease;
}

label:hover,
button:hover {
  transform: scale(1.05);
}
</style>