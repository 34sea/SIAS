<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import axios from 'axios';

const router = useRouter();
const toast = useToast();

const nome = ref('');
const categoria = ref(null);
const file = ref(null);
const preview = ref(null);
const loading = ref(false);

const categorias = [
    { label: 'Suspeito', value: 'Suspeito' },
    { label: 'Desaparecido', value: 'Desaparecido' },
    { label: 'Autorizado', value: 'Autorizado' },
    { label: 'Desconhecido', value: 'Desconhecido' },
];

const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
        file.value = e.target.files[0];
        preview.value = URL.createObjectURL(file.value);
    }
};

const removeImage = () => {
    file.value = null;
    preview.value = null;
};

const handleSubmit = async () => {
    if (!nome.value || !categoria.value || !file.value) {
        toast.add({
            severity: 'warn',
            summary: 'Atenção',
            detail: 'Preencha todos os campos',
            life: 3000
        });
        return;
    }

    loading.value = true;

    const formData = new FormData();
    formData.append('nome', nome.value);
    formData.append('categoria', categoria.value);
    formData.append('imagem', file.value);

    try {
        await axios.post('http://127.0.0.1:8000/rostos', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Rosto cadastrado',
            life: 3000
        });

        router.push('/ia/faces');

    } catch (err) {
        console.error(err);
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Falha ao cadastrar rosto',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="container">
        <div class="card">
            <h2 class="title">Adicionar Novo Rosto</h2>

            <div class="form">

                <div class="field">
                    <label>Nome</label>
                    <InputText v-model="nome" placeholder="Nome do rosto" />
                </div>

                <div class="field">
                    <label>Categoria</label>
                    <Dropdown style="height: 50px; display: flex; align-items: center;" v-model="categoria"
                        :options="categorias" optionLabel="label" optionValue="value"
                        placeholder="Selecione a categoria" />
                </div>

                <div class="field">
                    <label>Imagem</label>

                    <div class="upload-box" @click="$refs.fileInput.click()">
                        <input type="file" ref="fileInput" @change="onFileChange" hidden />

                        <!-- Placeholder -->
                        <div v-if="!preview" class="placeholder">
                            <i class="pi pi-image"></i>
                            <span>Clique ou arraste uma imagem</span>
                        </div>

                        <!-- Preview -->
                        <div v-else class="preview">
                            <img :src="preview" alt="Preview" />

                            <button class="remove-btn" @click.stop="removeImage">
                                ✕
                            </button>
                        </div>
                    </div>
                </div>
                <Button :label="loading ? 'Salvando...' : 'Salvar'" :loading="loading" @click="handleSubmit"
                    class="save-btn" />

            </div>
        </div>

        <Toast />
    </div>
</template>

<style scoped>
.container {
    display: flex;
    justify-content: center;
    padding: 2rem;
    background-color: white;
    border-radius: 10px;
}

.card {
    width: 100%;
    max-width: 520px;
    padding: 2rem;
    background: var(--surface-card);
    border-radius: 12px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
}

.form {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
}

.field input {
    height: 50px;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.upload-box {
    border: 2px dashed #ddd;
    padding: 1rem;
    border-radius: 8px;
}

.preview {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
}

.preview img {
    width: 200px;
    min-height: 200px;
    object-fit: cover;
    border-radius: 10px;
}

.save-btn {
    margin-top: 1rem;
}

.upload-box {
    border: 2px dashed #dcdcdc;
    border-radius: 12px;
    height: 220px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: 0.3s;
}

.upload-box:hover {
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.05);
}

/* Placeholder */
.placeholder {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #999;
    gap: 8px;
}

.placeholder i {
    font-size: 2rem;
}

/* Preview ocupa tudo */
.preview {
    width: 100%;
    height: 100%;
    position: relative;
}

.preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Botão remover overlay */
.remove-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    cursor: pointer;
    font-size: 14px;
}

.remove-btn:hover {
    background: red;
}
</style>