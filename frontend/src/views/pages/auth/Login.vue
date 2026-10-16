<script setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import { authService } from '@/services/authService';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref('admin@similaridade.co.mz');
const password = ref('Admin@123456');
const loading = ref(false);
const error = ref('');

const router = useRouter();

const handleLogin = async () => {
    error.value = '';
    if (!email.value || !password.value) {
        error.value = 'Todos os campos são obrigatórios.';
        return;
    }

    loading.value = true;
    try {
        const resposta = await authService.login(email.value, password.value);
        if (resposta.success && resposta.data) {
            localStorage.setItem('sias_token', resposta.data.token);
            localStorage.setItem('sias_user', JSON.stringify(resposta.data.utilizador));
            router.push('/dashboard');
        } else {
            error.value = resposta.error || 'Credenciais inválidas.';
        }
    } catch (err) {
        error.value = err.message || 'Erro ao iniciar sessão.';
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
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">SIAS</div>
                        <span class="text-muted-color font-medium">Sistema Inteligente para Análise de Similaridade</span>
                        <div v-if="error" class="text-red-500 mt-2">{{ error }}</div>
                    </div>

                    <div>
                        <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email / Utilizador</label>
                        <InputText id="email1" type="text" placeholder="admin@similaridade.co.mz" class="w-full md:w-[30rem] mb-4" v-model="email" />

                        <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Palavra-passe</label>
                        <Password id="password1" v-model="password" placeholder="••••••••" :toggleMask="true" class="mb-4" fluid :feedback="false"></Password>
                        <Button :label="loading ? 'Entrando...' : 'Entrar'" class="w-full mb-2" @click="handleLogin" :disabled="loading"></Button>

                        <div class="text-center mt-4 text-xs text-surface-600 dark:text-surface-400">
                            Admin: admin@similaridade.co.mz / Admin@123456
                        </div>
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
