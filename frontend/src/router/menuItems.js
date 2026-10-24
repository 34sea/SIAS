
const ALL_ROLES = ['ADMIN', 'DOCENTE', 'ESTUDANTE'];
const ADMIN_DOCENTE = ['ADMIN', 'DOCENTE'];
const ADMIN_ONLY = ['ADMIN'];

export const menuItems = [
    {
        label: 'Principal',
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-home',
                to: '/dashboard',
                roles: ALL_ROLES
            }
        ]
    },
    {
        label: 'Gestão de monografias',
        items: [
            {
                label: 'Monografias',
                icon: 'pi pi-fw pi-file',
                to: '/monografias',
                roles: ALL_ROLES
            },
            {
                label: 'Análises de similaridade',
                icon: 'pi pi-fw pi-search',
                to: '/analises',
                roles: ADMIN_DOCENTE
            },
            {
                label: 'Comparação de documentos',
                icon: 'pi pi-fw pi-copy',
                to: '/documentos-comparacao',
                roles: ADMIN_DOCENTE
            },
            {
                label: 'Orientações',
                icon: 'pi pi-fw pi-users',
                to: '/orientacoes',
                roles: ADMIN_DOCENTE
            },
            {
                label: 'Relatórios',
                icon: 'pi pi-fw pi-chart-bar',
                to: '/relatorios',
                roles: ADMIN_DOCENTE
            },
            {
                label: 'Notificações',
                icon: 'pi pi-fw pi-bell',
                to: '/notificacoes',
                roles: ALL_ROLES
            }
        ]
    },
    {
        label: 'Gestão académica',
        roles: ADMIN_ONLY,
        items: [
            {
                label: 'Cursos',
                icon: 'pi pi-fw pi-book',
                to: '/cursos',
                roles: ADMIN_ONLY
            },
            {
                label: 'Docentes',
                icon: 'pi pi-fw pi-user',
                to: '/docentes',
                roles: ADMIN_ONLY
            },
            {
                label: 'Estudantes',
                icon: 'pi pi-fw pi-users',
                to: '/estudantes',
                roles: ADMIN_ONLY
            }
        ]
    },
    {
        label: 'Administração do sistema',
        roles: ADMIN_ONLY,
        items: [
            {
                label: 'Utilizadores',
                icon: 'pi pi-fw pi-user-edit',
                to: '/manage/user',
                roles: ADMIN_ONLY
            },
            {
                label: 'Roles',
                icon: 'pi pi-fw pi-shield',
                to: '/manage/role',
                roles: ADMIN_ONLY
            },
            {
                label: 'Permissões',
                icon: 'pi pi-fw pi-lock',
                to: '/manage/permission',
                roles: ADMIN_ONLY
            }
        ]
    },
    {
        label: 'Conta',
        items: [
            {
                label: 'Meu perfil',
                icon: 'pi pi-fw pi-id-card',
                to: '/user/profile',
                roles: ALL_ROLES
            }
        ]
    }
];

export function getMenuByRole() {
    try {
        const user = JSON.parse(
            localStorage.getItem('sias_user') || 'null'
        );

        const role = user?.role_nome?.toUpperCase();

        if (!role || !ALL_ROLES.includes(role)) {
            return [];
        }

        return menuItems
            .map((group) => ({
                ...group,
                items: group.items.filter((item) =>
                    item.roles.includes(role)
                )
            }))
            .filter((group) => group.items.length > 0);
    } catch {
        return [];
    }
}
