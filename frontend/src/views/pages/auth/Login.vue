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
    <!-- Fundo geral branco que ocupa o ecrã inteiro e centra o cartão -->
    <div class="login-container flex items-center justify-center min-h-screen w-screen overflow-hidden bg-gray-50">
        
        <!-- Cartão Principal Centralizado (com sombra e cantos arredondados) -->
        <div class="flex flex-col lg:flex-row w-full max-w-5xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden min-h-[600px]">
            
            <!-- Lado Esquerdo: Painel Azul (Ocupa metade do cartão) -->
            <div class="hidden lg:flex lg:w-1/2 flex-col justify-between p-10 bg-blue-600 text-white relative">
                <div class="flex items-center gap-2">
                    <span class="text-2xl font-bold tracking-wider">SIAS</span>
                </div>

                <div class="flex flex-col items-center text-center my-auto px-4">
                    <div class="mb-6 p-5 bg-blue-500/30 rounded-full backdrop-blur-sm">
                        <i class="pi pi-chart-line text-5xl text-white"></i>
                    </div>
                    <h1 class="text-3xl font-bold mb-3" style="color: white;">Bem-vindo ao SIAS!</h1>
                    <p class="text-blue-100 text-sm max-w-sm">
                        Sistema Inteligente para Análise de Similaridade de Monografias e Trabalhos Académicos.
                    </p>
                </div>

                <div class="flex items-center gap-2">
                    <span class="w-6 h-1.5 bg-white rounded-full"></span>
                    <span class="w-1.5 h-1.5 bg-white/50 rounded-full"></span>
                    <span class="w-1.5 h-1.5 bg-white/50 rounded-full"></span>
                </div>
            </div>

            <!-- Lado Direito: Formulário com fundo branco (Ocupa a outra metade do cartão) -->
            <div class="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-white">
                <div class="w-full max-w-md">
                    <div class="mb-6">
                        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Iniciar Sessão</h2>
                        <p class="text-gray-500 text-sm">
                            Insira as suas credenciais para aceder ao painel.
                        </p>
                        <div v-if="error" class="p-3 mt-3 text-sm text-red-500 bg-red-50 rounded-lg">
                            {{ error }}
                        </div>
                    </div>

                    <div class="flex flex-col gap-4">
                        <div>
                            <label for="email1" class="block text-gray-700 font-medium mb-2 text-sm">Email / Utilizador</label>
                            <InputText 
                                id="email1" 
                                type="text" 
                                placeholder="admin@similaridade.co.mz" 
                                class="w-full" 
                                style="height: 50px;"
                                v-model="email" 
                            />
                        </div>

                        <div>
                            <label for="password1" class="block text-gray-700 font-medium mb-2 text-sm">Palavra-passe</label>
                            <Password 
                                id="password1" 
                                v-model="password" 
                                placeholder="••••••••" 
                                :toggleMask="true" 
                                class="w-full" 
                                style="height: 50px;"
                                fluid 
                                :feedback="false"
                            />
                        </div>

                        <Button 
                            :label="loading ? 'A entrar...' : 'Entrar'" 
                            class="w-full mt-2" 
                            style="background-color: #2563eb; height: 50px;"
                            
                            @click="handleLogin" 
                            :disabled="loading" 
                        />

                        <div class="text-center mt-4 text-xs text-gray-400">
                            Credenciais de Demonstração:<br>
                            <span class="font-mono text-gray-500">admin@similaridade.co.mz / Admin@123456</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<style scoped>
.login-container {
    min-height: 100vh;
}
:deep(.p-password input) {
    width: 100%;
}
</style>