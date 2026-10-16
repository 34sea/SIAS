const express = require('express');
const {
    getConfiguracoes,
    getConfiguracaoById,
    createConfiguracao,
    updateConfiguracao,
    deleteConfiguracao,
    getClassificacoes,
    createClassificacao,
    updateClassificacao,
    deleteClassificacao
} = require('../controllers/configuracoesController');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

const router = express.Router();

router.use(authMiddleware);

// --- Configurações de similaridade ---
router.get(
    '/',
    roleMiddleware('ADMIN'),
    permissionMiddleware('CONFIGURACOES_GERIR'),
    getConfiguracoes
);

router.get(
    '/:id',
    roleMiddleware('ADMIN'),
    permissionMiddleware('CONFIGURACOES_GERIR'),
    getConfiguracaoById
);

router.post(
    '/',
    roleMiddleware('ADMIN'),
    permissionMiddleware('CONFIGURACOES_GERIR'),
    createConfiguracao
);

router.put(
    '/:id',
    roleMiddleware('ADMIN'),
    permissionMiddleware('CONFIGURACOES_GERIR'),
    updateConfiguracao
);

router.delete(
    '/:id',
    roleMiddleware('ADMIN'),
    permissionMiddleware('CONFIGURACOES_GERIR'),
    deleteConfiguracao
);

// --- Classificações de similaridade ---
router.get(
    '/classificacoes',
    roleMiddleware('ADMIN'),
    permissionMiddleware('CONFIGURACOES_GERIR'),
    getClassificacoes
);

router.post(
    '/classificacoes',
    roleMiddleware('ADMIN'),
    permissionMiddleware('CONFIGURACOES_GERIR'),
    createClassificacao
);

router.put(
    '/classificacoes/:id',
    roleMiddleware('ADMIN'),
    permissionMiddleware('CONFIGURACOES_GERIR'),
    updateClassificacao
);

router.delete(
    '/classificacoes/:id',
    roleMiddleware('ADMIN'),
    permissionMiddleware('CONFIGURACOES_GERIR'),
    deleteClassificacao
);

module.exports = router;
