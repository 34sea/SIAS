<script setup>
import { ref } from 'vue';

import AppMenuItem from './AppMenuItem.vue';

const model = ref([
    {
        label: 'Home',
        items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/dashboard' }]
    },
    {
        label: 'Gestão(IA)',
        icon: 'pi pi-fw pi-briefcase',
        to: '/pages',
        items: [
            {
                label: 'Monitoramento',
                icon: 'pi pi-camera',
                to: '/ia/monitoring'
            },
            {
                label: 'Gestão de Rostos',
                icon: 'pi pi-address-book',
                items: [
                    {
                        label: 'Lista',
                        icon: 'pi pi-bars',
                        to: '/ia/faces'
                    },
                    {
                        label: 'Alertas',
                        icon: 'pi pi-bell',
                        to: '/ia/alerts'
                    },
                    {
                        label: 'Novo',
                        icon: 'pi pi-plus',
                        to: '/ia/new/faces'
                    }
                ]
            }
        ]
    },
    {
        label: 'Gestão de usuários',
        icon: 'pi pi-fw pi-briefcase',
        to: '/pages',
        items: [
            {
                label: 'Usuários',
                icon: 'pi pi-fw pi-users',
                to: '#',
                items: [
                    {
                        label: 'Lista',
                        icon: 'pi pi-bars',
                        to: '/manage/user'
                    },
                    
                ]
            },
            // {
            //     label: 'Roles',
            //     icon: 'pi pi-paperclip',
            //     items: [
            //         {
            //             label: 'Lista',
            //             icon: 'pi pi-bars',
            //             to: '/manage/role'
            //         },
                    
            //     ]
            // },
            // {
            //     label: 'Permissões',
            //     icon: 'pi pi-key',
            //     items: [
            //         {
            //             label: 'Lista',
            //             icon: 'pi pi-bars',
            //             to: '/manage/permission'
            //         },
                    
            //     ]
            // }
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
