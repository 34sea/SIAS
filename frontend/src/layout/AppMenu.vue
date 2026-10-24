<!-- <script setup>
import { ref } from 'vue';

import AppMenuItem from './AppMenuItem.vue';

const model = ref([
    {
        label: 'Home',
        items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/dashboard' }]
    },
    {
        label: 'SIAS',
        icon: 'pi pi-fw pi-file',
        items: [
            { label: 'Monografias', icon: 'pi pi-fw pi-book', to: '/monografias' },
            { label: 'Análises', icon: 'pi pi-fw pi-chart-bar', to: '/analises' },
            { label: 'Relatórios', icon: 'pi pi-fw pi-file-pdf', to: '/relatorios' },
            { label: 'Notificações', icon: 'pi pi-fw pi-bell', to: '/notificacoes' },
        ]
    },
    {
        label: 'Gestão Administrativa',
        icon: 'pi pi-fw pi-cog',
        items: [
            { label: 'Cursos', icon: 'pi pi-fw pi-university', to: '/cursos' },
            { label: 'Docentes', icon: 'pi pi-fw pi-user', to: '/docentes' },
            { label: 'Estudantes', icon: 'pi pi-fw pi-users', to: '/estudantes' },
            { label: 'Orientações', icon: 'pi pi-fw pi-sitemap', to: '/orientacoes' },
            { label: 'Documentos de Comparação', icon: 'pi pi-fw pi-file', to: '/documentos-comparacao' },
            { label: 'Utilizadores', icon: 'pi pi-fw pi-user-edit', to: '/manage/user' },
            { label: 'Perfis (Roles)', icon: 'pi pi-fw pi-id-card', to: '/manage/role' },
            { label: 'Permissões', icon: 'pi pi-fw pi-key', to: '/manage/permission' },
        ]
    },
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style> -->


<script setup>
import { computed } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

const roles = {
    ADMIN: ['ADMIN'],
    DOCENTE: ['ADMIN', 'DOCENTE'],
    TODOS: ['ADMIN', 'DOCENTE', 'ESTUDANTE']
};

const model = [
    {
        label: 'Home',
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-home',
                to: '/dashboard',
                roles: roles.TODOS
            }
        ]
    },
    {
        label: 'SIAS',
        icon: 'pi pi-fw pi-file',
        items: [
            {
                label: 'Monografias',
                icon: 'pi pi-fw pi-book',
                to: '/monografias',
                roles: roles.TODOS
            },
            {
                label: 'Análises',
                icon: 'pi pi-fw pi-chart-bar',
                to: '/analises',
                roles: roles.DOCENTE
            },
            {
                label: 'Relatórios',
                icon: 'pi pi-fw pi-file-pdf',
                to: '/relatorios',
                roles: roles.DOCENTE
            },
            {
                label: 'Notificações',
                icon: 'pi pi-fw pi-bell',
                to: '/notificacoes',
                roles: roles.TODOS
            },
            {
                label: 'Orientações',
                icon: 'pi pi-fw pi-sitemap',
                to: '/orientacoes',
                roles: roles.DOCENTE
            },
            {
                label: 'Documentos de Comparação',
                icon: 'pi pi-fw pi-file',
                to: '/documentos-comparacao',
                roles: roles.DOCENTE
            }
        ]
    },
    {
        label: 'Gestão Administrativa',
        icon: 'pi pi-fw pi-cog',
        roles: roles.ADMIN,
        items: [
            {
                label: 'Cursos',
                icon: 'pi pi-fw pi-university',
                to: '/cursos',
                roles: roles.ADMIN
            },
            {
                label: 'Docentes',
                icon: 'pi pi-fw pi-user',
                to: '/docentes',
                roles: roles.ADMIN
            },
            {
                label: 'Estudantes',
                icon: 'pi pi-fw pi-users',
                to: '/estudantes',
                roles: roles.ADMIN
            },
            {
                label: 'Utilizadores',
                icon: 'pi pi-fw pi-user-edit',
                to: '/manage/user',
                roles: roles.ADMIN
            },
            {
                label: 'Perfis (Roles)',
                icon: 'pi pi-fw pi-id-card',
                to: '/manage/role',
                roles: roles.ADMIN
            },
            {
                label: 'Permissões',
                icon: 'pi pi-fw pi-key',
                to: '/manage/permission',
                roles: roles.ADMIN
            }
        ]
    },
    {
        label: 'Conta',
        items: [
            {
                label: 'Meu perfil',
                icon: 'pi pi-fw pi-user',
                to: '/user/profile',
                roles: roles.TODOS
            }
        ]
    }
];

const userRole = computed(() => {
    try {
        const user = JSON.parse(
            localStorage.getItem('sias_user') || 'null'
        );

        return user?.role_nome?.toUpperCase() || null;
    } catch {
        return null;
    }
});

const filteredModel = computed(() => {
    const role = userRole.value;

    if (!role) return [];

    return model
        .map((group) => ({
            ...group,
            items: group.items.filter((item) =>
                item.roles?.includes(role)
            )
        }))
        .filter((group) => group.items.length > 0);
});
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in filteredModel" :key="item.label">
            <app-menu-item
                v-if="!item.separator"
                :item="item"
                :index="i"
            />
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>

