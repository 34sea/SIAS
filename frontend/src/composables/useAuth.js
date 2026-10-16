import { ref, computed, onMounted } from 'vue';
import { authService } from '@/services/authService';

const user = ref(null);
const token = ref(localStorage.getItem('sias_token') || null);
const loading = ref(false);
const error = ref(null);

export function useAuth() {
    const isAuthenticated = computed(() => !!token.value);
    const role = computed(() => {
        if (user.value) {
            return user.value.role_nome || user.value.role || null;
        }
        return null;
    });

    async function login(email, password) {
        loading.value = true;
        error.value = null;
        try {
            const resposta = await authService.login(email, password);
            if (resposta.success && resposta.data) {
                token.value = resposta.data.token;
                user.value = resposta.data.utilizador;
                if (token.value) {
                    localStorage.setItem('sias_token', token.value);
                }
                if (user.value) {
                    localStorage.setItem('sias_user', JSON.stringify(user.value));
                }
                return { success: true, data: user.value };
            } else {
                error.value = resposta.error || 'Credenciais inválidas.';
                return { success: false, error: error.value };
            }
        } catch (err) {
            error.value = err.message || 'Erro ao iniciar sessão.';
            return { success: false, error: error.value };
        } finally {
            loading.value = false;
        }
    }

    function logout() {
        token.value = null;
        user.value = null;
        localStorage.removeItem('sias_token');
        localStorage.removeItem('sias_user');
    }

    function carregarUtilizador() {
        const saved = localStorage.getItem('sias_user');
        if (saved && !user.value) {
            try {
                user.value = JSON.parse(saved);
            } catch (_) {
                user.value = null;
            }
        }
    }

    // Carregar utilizador salvo no localStorage imediatamente
    carregarUtilizador();

    return {
        user,
        token,
        loading,
        error,
        isAuthenticated,
        role,
        login,
        logout,
        carregarUtilizador,
    };
}
