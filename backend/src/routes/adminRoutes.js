const express = require('express');

const {
    createAdmin
} = require('../controllers/adminController');

const router = express.Router();

console.log('>>> adminRoutes.js carregado');

router.use((req, res, next) => {

    console.log('');
    console.log('========== ADMIN ROUTER ==========');
    console.log('Método:', req.method);
    console.log('Original URL:', req.originalUrl);
    console.log('Path:', req.path);
    console.log('IP:', req.ip);
    console.log('==================================');

    next();
});

// Rota pública
router.post('/admin', createAdmin);

module.exports = router;