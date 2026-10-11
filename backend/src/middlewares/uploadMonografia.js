const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadDir = path.join(process.cwd(), 'uploads', 'monografias');

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const extensao = path.extname(file.originalname).toLowerCase();
        const nome = `${Date.now()}-${crypto.randomUUID()}${extensao}`;

        cb(null, nome);
    }
});

const extensoesPermitidas = new Set([
    '.pdf',
    '.doc',
    '.docx'
]);

const mimeTypesPermitidos = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

const uploadMonografia = multer({
    storage,

    limits: {
        fileSize: 25 * 1024 * 1024,
        files: 1
    },

    fileFilter: (req, file, cb) => {
        const extensao = path.extname(file.originalname).toLowerCase();

        if (
            !extensoesPermitidas.has(extensao) ||
            !mimeTypesPermitidos.has(file.mimetype)
        ) {
            return cb(
                new Error('Formato inválido. Envie um ficheiro PDF, DOC ou DOCX.')
            );
        }

        cb(null, true);
    }
});

module.exports = uploadMonografia;