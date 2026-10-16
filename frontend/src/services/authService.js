import { authApi } from '@/api/auth';

export const authService = {
    async login(email, password) {
        const { data } = await authApi.login({ identificador: email, password_hash: password });
        return data;
    },
    async me() {
        const { data } = await authApi.me();
        return data;
    },
    async logout() {
        await authApi.logout();
    },
};
