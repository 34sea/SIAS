const express = require('express');

const {
    login,
    me,
    changePassword,
    logout
} = require('../controllers/authController');

const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', login);

router.get('/me', authMiddleware, me);

router.put(
    '/change-password',
    authMiddleware,
    changePassword
);

router.post(
    '/logout',
    authMiddleware,
    logout
);

module.exports = router;