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
const upload = require('../middlewares/uploadMiddleware'); // <-- 1. Importa o teu multer aqui (ajusta o caminho se necessário)

const router = express.Router();

router.use(authMiddleware);

router.get(
    '/',
    roleMiddleware('ADMIN', 'DOCENTE'),
    permissionMiddleware('DOCUMENTOS_GERIR'),
    getDocumentosComparacao
);

router.get(
    '/',
    roleMiddleware('ADMIN', 'DOCENTE'),
    permissionMiddleware('DOCUMENTOS_GERIR'),
    getDocumentoComparacaoById
);

router.post(
    '/',
    roleMiddleware('ADMIN'),
    permissionMiddleware('DOCUMENTOS_GERIR'),
    upload.single('ficheiro'), // <-- 2. Adicionado aqui para processar o ficheiro e popular o req.body
    createDocumentoComparacao
);

router.put(
    '/:id',
    roleMiddleware('ADMIN'),
    permissionMiddleware('DOCUMENTOS_GERIR'),
    upload.single('ficheiro'), // <-- 3. Adicionado aqui também para atualizações com novo ficheiro
    updateDocumentoComparacao
);

router.delete(
    '/:id',
    roleMiddleware('ADMIN'),
    permissionMiddleware('DOCUMENTOS_GERIR'),
    deleteDocumentoComparacao
);

module.exports = router;