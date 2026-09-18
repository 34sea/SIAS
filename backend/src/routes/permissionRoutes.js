const express = require('express');

const {
    getPermissions,
    getPermissionById,
    createPermission,
    updatePermission
} = require('../controllers/permissionController');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get(
    '/',
    roleMiddleware('ADMIN'),
    getPermissions
);

router.get(
    '/:id',
    roleMiddleware('ADMIN'),
    getPermissionById
);

router.post(
    '/',
    roleMiddleware('ADMIN'),
    createPermission
);

router.put(
    '/:id',
    roleMiddleware('ADMIN'),
    updatePermission
);

module.exports = router;