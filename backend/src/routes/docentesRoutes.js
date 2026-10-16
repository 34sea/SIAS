const express = require('express');
const {
    getDocentes,
    getDocenteById,
    createDocente,
    updateDocente,
    deleteDocente
} = require('../controllers/docentesController');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get(
    '/',
    roleMiddleware('ADMIN'),
    permissionMiddleware('ORIENTADORES_GERIR'),
    getDocentes
);

router.get(
    '/:id',
    roleMiddleware('ADMIN'),
    permissionMiddleware('ORIENTADORES_GERIR'),
    getDocenteById
);

router.post(
    '/',
    roleMiddleware('ADMIN'),
    permissionMiddleware('ORIENTADORES_GERIR'),
    createDocente
);

router.put(
    '/:id',
    roleMiddleware('ADMIN'),
    permissionMiddleware('ORIENTADORES_GERIR'),
    updateDocente
);

router.delete(
    '/:id',
    roleMiddleware('ADMIN'),
    permissionMiddleware('ORIENTADORES_GERIR'),
    deleteDocente
);

module.exports = router;
