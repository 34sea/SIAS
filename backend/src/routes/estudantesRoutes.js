const express = require('express');
const {
    getEstudantes,
    getEstudanteById,
    createEstudante,
    updateEstudante,
    deleteEstudante
} = require('../controllers/estudantesController');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get(
    '/',
    roleMiddleware('ADMIN'),
    permissionMiddleware('UTILIZADORES_VISUALIZAR'),
    getEstudantes
);

router.get(
    '/:id',
    roleMiddleware('ADMIN'),
    permissionMiddleware('UTILIZADORES_VISUALIZAR'),
    getEstudanteById
);

router.post(
    '/',
    roleMiddleware('ADMIN'),
    permissionMiddleware('UTILIZADORES_CRIAR'),
    createEstudante
);

router.put(
    '/:id',
    roleMiddleware('ADMIN'),
    permissionMiddleware('UTILIZADORES_EDITAR'),
    updateEstudante
);

router.delete(
    '/:id',
    roleMiddleware('ADMIN'),
    permissionMiddleware('UTILIZADORES_DESATIVAR'),
    deleteEstudante
);

module.exports = router;
