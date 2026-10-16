const express = require('express');
const {
    getNotificacoes,
    criarNotificacao,
    marcarComoLida,
    eliminarNotificacao
} = require('../controllers/notificacoesController');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get(
    '/',
    getNotificacoes
);

router.post(
    '/',
    roleMiddleware('ADMIN', 'DOCENTE'),
    criarNotificacao
);

router.patch(
    '/:id/lida',
    marcarComoLida
);

router.delete(
    '/:id',
    roleMiddleware('ADMIN'),
    eliminarNotificacao
);

module.exports = router;
