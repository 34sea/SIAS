const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const documentRoutes = require('./routes/documentRoutes');
const roleRoutes = require('./routes/roleRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(express.json());

app.use((req, res, next) => {

    const inicio = Date.now();

    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║          NOVA REQUISIÇÃO HTTP            ║');
    console.log('╚══════════════════════════════════════════╝');

    console.log('Método:', req.method);
    console.log('URL:', req.originalUrl);
    console.log('IP:', req.ip);
    console.log('User-Agent:', req.headers['user-agent']);
    console.log('Content-Type:', req.headers['content-type']);
    console.log(
        'Authorization:',
        req.headers.authorization ? 'ENVIADO' : 'NÃO ENVIADO'
    );

    res.on('finish', () => {

        const tempo = Date.now() - inicio;

        console.log('');
        console.log('---------- RESPOSTA ----------');
        console.log('URL:', req.originalUrl);
        console.log('Status:', res.statusCode);
        console.log('Tempo:', `${tempo} ms`);
        console.log('------------------------------');
        console.log('');
    });

    next();
});
// Expor a pasta de uploads estaticamente (para visualizar as imagens salvas)
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas da API
app.use('/api/seed', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);

app.use('/api', productRoutes); 
app.use('/api', documentRoutes);

module.exports = app;