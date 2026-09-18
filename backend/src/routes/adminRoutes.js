const express = require('express');
const { createAdmin } = require('../controllers/adminController');

const router = express.Router();

// Rota pública - não requer autenticação
router.post('/admin', createAdmin);

module.exports = router;