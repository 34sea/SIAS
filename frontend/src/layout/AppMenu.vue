<script setup>
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

<style lang="scss" scoped></style>
