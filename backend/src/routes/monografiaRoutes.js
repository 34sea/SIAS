
const express = require('express');

const {
    getMonografias,
    getMonografiaById,
    createMonografia,
    updateMonografia,
    getMonografiaVersoes,
    getMonografiaVersaoById,
    createMonografiaVersao,
    deleteMonografia
} = require('../controllers/monografiaController');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const uploadMonografia = require('../middlewares/uploadMonografia');

const router = express.Router();

// Todas as rotas exigem autenticação.
router.use(authMiddleware);

// Listar monografias.
// As permissões por perfil e os filtros são tratados no controller.
router.get(
    '/',
    getMonografias
);

// Consultar monografia e histórico de versões.
router.get(
    '/:id',
    getMonografiaById
);

// Submeter uma nova monografia.
router.post(
    '/',
    roleMiddleware('ESTUDANTE'),
    uploadMonografia.single('ficheiro'),
    createMonografia
);

// Atualizar os metadados de uma monografia.
router.put(
    '/:id',
    updateMonografia
);

// Consultar todas as versões de uma monografia.
router.get(
    '/:id/versoes',
    getMonografiaVersoes
);

// Submeter uma nova versão.
router.post(
    '/:id/versoes',
    uploadMonografia.single('ficheiro'),
    createMonografiaVersao
);

// Consultar uma versão específica.
router.get(
    '/:id/versoes/:versaoId',
    getMonografiaVersaoById
);

// Arquivar uma monografia, sem eliminar o histórico.
router.delete(
    '/:id',
    deleteMonografia
);

module.exports = router;