const express = require('express');
const { getAuditoria } = require('../controllers/auditoriaController');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get(
    '/',
    roleMiddleware('ADMIN'),
    permissionMiddleware('AUDITORIA_VISUALIZAR'),
    getAuditoria
);

module.exports = router;
