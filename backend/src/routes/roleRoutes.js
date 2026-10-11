// const express = require('express');
// const {
//     getRoles,
//     getRoleById,
//     createRole,
//     updateRole,
//     deleteRole,
//     getRolePermissions,
//     assignRolePermissions,
//     addPermissionToRole,
//     removePermissionFromRole
// } = require('../controllers/roleController');

// const authMiddleware = require('../middlewares/authMiddleware');
// const roleMiddleware = require('../middlewares/roleMiddleware');

// const router = express.Router();

// router.use(authMiddleware);

// // --- Rotas de Perfis (Roles) ---

// router.get(
//     '/',
//     roleMiddleware('ADMIN'),
//     getRoles
// );

// router.get(
//     '/:id',
//     roleMiddleware('ADMIN'),
//     getRoleById
// );

// router.post(
//     '/',
//     roleMiddleware('ADMIN'),
//     createRole
// );

// router.put(
//     '/:id',
//     roleMiddleware('ADMIN'),
//     updateRole
// );

// router.delete(
//     '/:id',
//     roleMiddleware('ADMIN'),
//     deleteRole
// );

// // --- Rotas de Relacionamento Role <-> Permissões ---

// // Listar permissões do perfil
// router.get(
//     '/:id/permissoes',
//     roleMiddleware('ADMIN'),
//     getRolePermissions
// );

// // Substituir/Atribuir lote completo de permissões (PUT)
// router.put(
//     '/:id/permissoes',
//     roleMiddleware('ADMIN'),
//     assignRolePermissions
// );

// // Adicionar uma única permissão ao perfil (POST)
// router.post(
//     '/:id/permissoes',
//     roleMiddleware('ADMIN'),
//     addPermissionToRole
// );

// // Remover uma única permissão do perfil (DELETE)
// router.delete(
//     '/:id/permissoes/:permissaoId',
//     roleMiddleware('ADMIN'),
//     removePermissionFromRole
// );

// // router.patch(
// //     '/:id/status',
// //     roleMiddleware('ADMIN'),
// //     updateRoleStatus
// // );

// // router.get(
// //     '/:id/permissions',
// //     roleMiddleware('ADMIN'),
// //     getRolePermissions
// // );

// // router.put(
// //     '/:id/permissions',
// //     roleMiddleware('ADMIN'),
// //     assignRolePermissions
// // );

// // router.delete(
// //     '/:id/permissions',
// //     roleMiddleware('ADMIN'),
// //     deleteRole
// // )
// module.exports = router;

const express = require('express');

const {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    getRolePermissions,
    assignRolePermissions,
    addPermissionToRole,
    removePermissionFromRole
} = require('../controllers/roleController');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);

// ==========================================
// 1. ROTAS ESPECÍFICAS DE PERMISSÕES DO PERFIL
// (DEVEM FICAR ANTES DE /:id para o Express não capturar errado)
// ==========================================

router.get(
    '/:id/permissoes',
    roleMiddleware('ADMIN'),
    getRolePermissions
);

router.put(
    '/:id/permissoes',
    roleMiddleware('ADMIN'),
    assignRolePermissions
);

router.post(
    '/:id/permissoes',
    roleMiddleware('ADMIN'),
    addPermissionToRole
);

router.delete(
    '/:id/permissoes/:permissaoId',
    roleMiddleware('ADMIN'),
    removePermissionFromRole
);

// ==========================================
// 2. ROTAS GENÉRICAS DE PERFIS (CRUD)
// ==========================================

router.get(
    '/',
    roleMiddleware('ADMIN'),
    getRoles
);

router.get(
    '/:id',
    roleMiddleware('ADMIN'),
    getRoleById
);

router.post(
    '/',
    roleMiddleware('ADMIN'),
    createRole
);

router.put(
    '/:id',
    roleMiddleware('ADMIN'),
    updateRole
);

router.delete(
    '/:id',
    roleMiddleware('ADMIN'),
    deleteRole
);

module.exports = router;