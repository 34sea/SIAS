// const express = require('express');

// const {
//     getUsers,
//     getUserById,
//     createUser,
//     updateUser,
//     updateUserStatus,
//     updateUserPassword,
//     deleteUser
// } = require('../controllers/userController');

// const authMiddleware = require('../middlewares/authMiddleware');
// const roleMiddleware = require('../middlewares/roleMiddleware');

// const router = express.Router();

// router.use(authMiddleware);

// router.get(
//     '/',
//     roleMiddleware('ADMIN'),
//     getUsers
// );

// router.get(
//     '/:id',
//     roleMiddleware('ADMIN'),
//     getUserById
// );

// router.post(
//     '/',
//     roleMiddleware('ADMIN'),
//     createUser
// );

// router.put(
//     '/:id',
//     roleMiddleware('ADMIN'),
//     updateUser
// );

// router.patch(
//     '/:id/status',
//     roleMiddleware('ADMIN'),
//     updateUserStatus
// );

// router.patch(
//     '/:id/password',
//     roleMiddleware('ADMIN'),
//     updateUserPassword
// );

// router.delete(
//     '/:id',
//     roleMiddleware('ADMIN'),
//     deleteUser
// );

// module.exports = router;

const express = require('express');

const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    updateUserStatus,
    updateUserPassword,
    deleteUser
} = require('../controllers/userController');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const uploadUser = require('../middlewares/uploadUser'); // Importação do middleware de upload

const router = express.Router();

// Aplica autenticação para todas as rotas abaixo
router.use(authMiddleware);

router.get(
    '/',
    roleMiddleware('ADMIN'),
    getUsers
);

router.get(
    '/:id',
    roleMiddleware('ADMIN'),
    getUserById
);

// uploadUser.single('foto') intercepta o campo 'foto' do formulário
router.post(
    '/',
    // roleMiddleware('ADMIN'),
    uploadUser.single('foto'),
    createUser
);

router.put(
    '/:id',
    roleMiddleware('ADMIN'),
    uploadUser.single('foto'),
    updateUser
);

router.patch(
    '/:id/status',
    roleMiddleware('ADMIN'),
    updateUserStatus
);

router.patch(
    '/:id/password',
    roleMiddleware('ADMIN'),
    updateUserPassword
);

router.delete(
    '/:id',
    roleMiddleware('ADMIN'),
    deleteUser
);

module.exports = router;