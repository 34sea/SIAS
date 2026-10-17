const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const documentRoutes = require('./routes/documentRoutes');
const monografiaRoutes = require('./routes/monografiaRoutes');
const roleRoutes = require('./routes/roleRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

const cursosRoutes = require('./routes/cursosRoutes');
const docentesRoutes = require('./routes/docentesRoutes');
const estudantesRoutes = require('./routes/estudantesRoutes');
const orientacoesRoutes = require('./routes/orientacoesRoutes');
const analisesRoutes = require('./routes/analisesRoutes');
const documentosComparacaoRoutes = require('./routes/documentosComparacaoRoutes');
const configuracoesRoutes = require('./routes/configuracoesRoutes');
const relatoriosRoutes = require('./routes/relatoriosRoutes');
const notificacoesRoutes = require('./routes/notificacoesRoutes');
const auditoriaRoutes = require('./routes/auditoriaRoutes');

const app = express();

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use((req, res, next) => {
    const inicio = Date.now();
    console.log('');
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║          NOVA REQUISIÇÃO HTTP                  ║');
    console.log('╚════════════════════════════════════════════════╝');
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
        console.log('---------- RESPOSTA ----------');
        console.log('URL:', req.originalUrl);
        console.log('Status:', res.statusCode);
        console.log('Tempo:', `${tempo} ms`);
        console.log('------------------------------');
        console.log('');
    });
    next();
});

// app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));
// app.use('/src/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));
// app.use('/uploads', express.static(path.join(__dirname, 'src', 'uploads')));
console.log("A procurar uploads em:", path.join(__dirname, 'uploads'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/seed', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissoes', permissionRoutes);
app.use('/api/moonograph', monografiaRoutes);

app.use('/api/cursos', cursosRoutes);
app.use('/api/docentes', docentesRoutes);
app.use('/api/estudantes', estudantesRoutes);
app.use('/api/orientacoes', orientacoesRoutes);
app.use('/api/analises', analisesRoutes);
app.use('/api/documentos-comparacao', documentosComparacaoRoutes);
app.use('/api/configuracoes-similaridade', configuracoesRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/notificacoes', notificacoesRoutes);
app.use('/api/auditoria', auditoriaRoutes);

app.use('/api', productRoutes);
app.use('/api', documentRoutes);

module.exports = app;
