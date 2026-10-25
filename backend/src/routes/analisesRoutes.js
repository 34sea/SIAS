const express = require('express');
const {
    getAnalises,
    getAnaliseById,
    createAnalise,
    reanalisarAnalise
} = require('../controllers/analisesController');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get(
    '/',
    // roleMiddleware('ADMIN', 'DOCENTE'),
    // permissionMiddleware('ANALISES_VISUALIZAR'),
    getAnalises
);

router.get(
    '/:id',
    // roleMiddleware('ADMIN', 'DOCENTE', 'ESTUDANTE'),
    // permissionMiddleware('ANALISES_VISUALIZAR'),
    getAnaliseById
);

router.post(
    '/',
    roleMiddleware('ADMIN', 'DOCENTE'),
    permissionMiddleware('ANALISES_EXECUTAR'),
    createAnalise
);

router.post(
    '/:id/reanalisar',
    roleMiddleware('ADMIN'),
    permissionMiddleware('ANALISES_REANALISAR'),
    reanalisarAnalise
);

module.exports = router;
