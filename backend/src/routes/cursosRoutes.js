const express = require('express');
const {
    getCursos,
    getCursoById,
    createCurso,
    updateCurso,
    deleteCurso
} = require('../controllers/cursosController');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get(
    '/',
    // roleMiddleware('ADMIN'),
    // permissionMiddleware('CURSOS_GERIR'),
    getCursos
);

router.get(
    '/:id',
    // roleMiddleware('ADMIN'),
    // permissionMiddleware('CURSOS_GERIR'),
    getCursoById
);

router.post(
    '/',
    roleMiddleware('ADMIN'),
    permissionMiddleware('CURSOS_GERIR'),
    createCurso
);

router.put(
    '/:id',
    roleMiddleware('ADMIN'),
    permissionMiddleware('CURSOS_GERIR'),
    updateCurso
);

router.delete(
    '/:id',
    roleMiddleware('ADMIN'),
    permissionMiddleware('CURSOS_GERIR'),
    deleteCurso
);

module.exports = router;
