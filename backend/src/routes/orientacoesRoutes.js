const express = require('express');
const {
    getOrientacoes,
    getOrientacaoById,
    createOrientacao,
    updateOrientacao,
    deleteOrientacao
} = require('../controllers/orientacoesController');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get(
    '/',
    // roleMiddleware('ADMIN'),
    // permissionMiddleware('ORIENTADORES_GERIR'),
    getOrientacoes
);

router.get(
    '/:id',
    // roleMiddleware('ADMIN'),
    // permissionMiddleware('ORIENTADORES_GERIR'),
    getOrientacaoById
);

router.post(
    '/',
    roleMiddleware('ADMIN'),
    permissionMiddleware('ORIENTADORES_GERIR'),
    createOrientacao
);

router.put(
    '/:id',
    roleMiddleware('ADMIN'),
    permissionMiddleware('ORIENTADORES_GERIR'),
    updateOrientacao
);

router.delete(
    '/:id',
    roleMiddleware('ADMIN'),
    permissionMiddleware('ORIENTADORES_GERIR'),
    deleteOrientacao
);

module.exports = router;
