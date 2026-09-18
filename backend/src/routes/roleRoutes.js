const express = require('express');

const {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    updateRoleStatus,
    getRolePermissions,
    assignRolePermissions
} = require('../controllers/roleController');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);

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

router.patch(
    '/:id/status',
    roleMiddleware('ADMIN'),
    updateRoleStatus
);

router.get(
    '/:id/permissions',
    roleMiddleware('ADMIN'),
    getRolePermissions
);

router.put(
    '/:id/permissions',
    roleMiddleware('ADMIN'),
    assignRolePermissions
);

module.exports = router;