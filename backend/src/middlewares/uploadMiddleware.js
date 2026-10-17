const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Garante que a pasta de uploads de documentos existe
const uploadDir = path.join(__dirname, '../../uploads/documentos');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do armazenamento do Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `doc-${uniqueSuffix}${ext}`);
    }
});

// Filtro opcional para aceitar apenas documentos PDF e Word
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|doc|docx)$/i)) {
        cb(null, true);
    } else {
        cb(new Error('Apenas ficheiros PDF, DOC ou DOCX são permitidos!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024 // Limite de 15MB
    }
});

module.exports = upload;