const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'chave_da_api_jwt_SIAS';

// module.exports = (req, res, next) => {

//     console.log('');
//     console.log('========== AUTH MIDDLEWARE ==========');
//     console.log('Método:', req.method);
//     console.log('URL:', req.originalUrl);
//     console.log('Path:', req.path);
//     console.log('IP:', req.ip);
//     console.log('User-Agent:', req.headers['user-agent']);
//     console.log('Authorization:', req.headers.authorization ? 'ENVIADO' : 'NÃO ENVIADO');

//     const authHeader = req.headers.authorization;

//     if (!authHeader) {
//         console.log('❌ AUTH: Token não fornecido');
//         console.log('====================================');
        
//         return res.status(401).json({
//             error: 'Token não fornecido'
//         });
//     }

//     const parts = authHeader.split(' ');

//     console.log('Formato Authorization:', parts[0]);

//     if (parts.length !== 2 || parts[0] !== 'Bearer') {
//         console.log('❌ AUTH: Formato de token inválido');
//         console.log('====================================');

//         return res.status(401).json({
//             error: 'Formato de token inválido. Use: Bearer <token>'
//         });
//     }

//     const token = parts[1];

//     try {
//         const decoded = jwt.verify(token, JWT_SECRET);

//         console.log('✅ AUTH: Token válido');
//         console.log('Utilizador:', decoded);
//         console.log('====================================');

//         req.user = decoded;

//         return next();

//     } catch (err) {

//         console.log('❌ AUTH: Token inválido ou expirado');
//         console.log('Erro:', err.message);
//         console.log('====================================');

//         return res.status(401).json({
//             error: 'Token inválido ou expirado'
//         });
//     }
// };


module.exports = (req, res, next) => {

    console.log('');
    console.log('========== AUTH MIDDLEWARE ==========');
    console.log('Método:', req.method);
    console.log('URL:', req.originalUrl);
    console.log('Path:', req.path);

    // Rotas que não precisam de autenticação
    const publicRoutes = [
        { method: 'POST', path: '/api/users' },
        // { method: 'GET', path: '/api/orientacoes' },
        // { method: 'GET', path: '/api/analises' },
    ];

    // Usa originalUrl para identificar o caminho completo
    const routePath = req.originalUrl.split('?')[0];

    const isPublicRoute = publicRoutes.some(route =>
        req.method === route.method &&
        routePath === route.path
    );

    if (isPublicRoute) {
        console.log('✅ AUTH: Rota pública, autenticação ignorada');
        console.log('====================================');
        return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        console.log('❌ AUTH: Token não fornecido');
        console.log('====================================');

        return res.status(401).json({
            error: 'Token não fornecido'
        });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            error: 'Formato de token inválido. Use: Bearer <token>'
        });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = decoded;

        console.log('✅ AUTH: Token válido');
        console.log('Utilizador:', decoded);
        console.log('====================================');

        return next();

    } catch (err) {
        console.log('❌ AUTH: Token inválido ou expirado');
        console.log('Erro:', err.message);
        console.log('====================================');

        return res.status(401).json({
            error: 'Token inválido ou expirado'
        });
    }
};