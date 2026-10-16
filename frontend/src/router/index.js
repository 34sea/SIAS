import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'Login',
            component: () => import('@/views/pages/auth/Login.vue')
        },
        {
            path: '/dashboard',
            component: AppLayout,
            children: [
                {
                    path: '/dashboard',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue')
                },

                // --- SIAS: Monografias ---
                {
                    path: '/monografias',
                    name: 'monografias',
                    component: () => import('@/views/pages/Monografias.vue')
                },
                {
                    path: '/analises',
                    name: 'analises',
                    component: () => import('@/views/pages/Analises.vue')
                },
                {
                    path: '/relatorios',
                    name: 'relatorios',
                    component: () => import('@/views/pages/Relatorios.vue')
                },
                {
                    path: '/notificacoes',
                    name: 'notificacoes',
                    component: () => import('@/views/pages/Notificacoes.vue')
                },

                // --- SIAS: Gestão administrativa ---
                {
                    path: '/cursos',
                    name: 'cursos',
                    component: () => import('@/views/pages/Cursos.vue')
                },
                {
                    path: '/docentes',
                    name: 'docentes',
                    component: () => import('@/views/pages/Docentes.vue')
                },
                {
                    path: '/estudantes',
                    name: 'estudantes',
                    component: () => import('@/views/pages/Estudantes.vue')
                },
                {
                    path: '/orientacoes',
                    name: 'orientacoes',
                    component: () => import('@/views/pages/Orientacoes.vue')
                },
                {
                    path: '/documentos-comparacao',
                    name: 'documentos-comparacao',
                    component: () => import('@/views/pages/DocumentosComparacao.vue')
                },
                //-----------------------------------
                //User managemente
                {
                    path: '/manage/user',
                    name: '/manage/user',
                    component: () => import('@/views/pages/usermanagement/users/User.vue')
                },
                {
                    path: '/manage/role',
                    name: '/manage/role',
                    component: () => import('@/views/pages/usermanagement/roles/Roles.vue')
                },
                {
                    path: '/manage/permission',
                    name: '/manage/permission',
                    component: () => import('@/views/pages/usermanagement/permissions/Permissions.vue')
                },
                //-----------------------------------
                //Profile
                {
                    path: '/user/profile',
                    name: '/user/profile',
                    component: () => import('@/views/pages/profile/Profile.vue')
                },
            ]
        },
        {
            path: '/landing',
            name: 'landing',
            component: () => import('@/views/pages/Landing.vue')
        },
        {
            path: '/pages/notfound',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue')
        },
        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue')
        },
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/pages/auth/Access.vue')
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/pages/auth/Error.vue')
        }
    ]
});

export default router;
