<script setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import { login } from '@/services/authService';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref('martinho@email.com');
const password = ref('123456');
const loading = ref(false)
const error = ref('');
const checked = ref(false);

const router = useRouter();

const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

const handleLogin = async () => {
    error.value = '';
    if (!email.value || !password.value) {
        error.value = 'Todos os campos são obrigatórios.';
        return;
    }
    if (!isValidEmail(email.value)) {
        error.value = 'Por favor, insira um email válido.';
        return;
    }

    loading.value = true;
    try {
        const data = await login(email.value, password.value);
        localStorage.setItem('user', JSON.stringify(data));
        router.push('/dashboard');
    } catch (err) {
        error.value = err.message || 'Erro ao fazer login';
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <FloatingConfigurator />
    <div
        class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div
                style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Titulo</div>
                        <span class="text-muted-color font-medium">Preencha os campos</span>
                        <div v-if="error" class="text-red-500 mt-2">{{ error }}</div>
                    </div>

                    <div>
                        <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                        <InputText id="email1" type="text" placeholder="Email address" class="w-full md:w-[30rem] mb-4" v-model="email" />

                        <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                        <Password id="password1" v-model="password" placeholder="Password" :toggleMask="true" class="mb-4" fluid :feedback="false"></Password>
                        <!-- <Button label="Entrar" class="w-full" as="router-link" to="/dashboard"></Button>        -->
                        <Button :label="loading ? 'Entrando...' : 'Entrar'" class="w-full mb-2" @click="handleLogin"
                            :disabled="loading"></Button>

                        
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
