const express = require('express');
const {
    getDocumentosComparacao,
    getDocumentoComparacaoById,
    createDocumentoComparacao,
    updateDocumentoComparacao,
    deleteDocumentoComparacao
} = require('../controllers/documentosComparacaoController');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get(
    '/',
    roleMiddleware('ADMIN', 'DOCENTE'),
    permissionMiddleware('DOCUMENTOS_GERIR'),
    getDocumentosComparacao
);

router.get(
    '/:id',
    roleMiddleware('ADMIN', 'DOCENTE'),
    permissionMiddleware('DOCUMENTOS_GERIR'),
    getDocumentoComparacaoById
);

router.post(
    '/',
    roleMiddleware('ADMIN'),
    permissionMiddleware('DOCUMENTOS_GERIR'),
    createDocumentoComparacao
);

router.put(
    '/:id',
    roleMiddleware('ADMIN'),
    permissionMiddleware('DOCUMENTOS_GERIR'),
    updateDocumentoComparacao
);

router.delete(
    '/:id',
    roleMiddleware('ADMIN'),
    permissionMiddleware('DOCUMENTOS_GERIR'),
    deleteDocumentoComparacao
);

module.exports = router;
