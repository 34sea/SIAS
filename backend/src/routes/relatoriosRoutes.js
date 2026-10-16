const express = require('express');
const {
    getRelatorios,
    getRelatorioById,
    gerarRelatorio,
    atualizarDisponibilidade
} = require('../controllers/relatoriosController');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get(
    '/',
    roleMiddleware('ADMIN', 'DOCENTE', 'ESTUDANTE'),
    permissionMiddleware('RELATORIOS_VISUALIZAR'),
    getRelatorios
);

router.get(
    '/:id',
    roleMiddleware('ADMIN', 'DOCENTE', 'ESTUDANTE'),
    permissionMiddleware('RELATORIOS_VISUALIZAR'),
    getRelatorioById
);

router.post(
    '/',
    roleMiddleware('ADMIN'),
    permissionMiddleware('RELATORIOS_EXPORTAR'),
    gerarRelatorio
);

router.patch(
    '/:id/disponibilidade',
    roleMiddleware('ADMIN'),
    permissionMiddleware('RELATORIOS_EXPORTAR'),
    atualizarDisponibilidade
);

module.exports = router;
