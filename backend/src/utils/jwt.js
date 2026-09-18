const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "chave_da_api_jwt_SIAS";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

if (!JWT_SECRET) {
    throw new Error(
        'JWT_SECRET não está definido nas variáveis de ambiente.'
    );
};

/**
 * Gerar token JWT
 */
const signToken = (payload) => {
    return jwt.sign(
        payload,
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRES_IN
        }
    );
};

/**
 * Verificar token JWT
 */
const verifyToken = (token) => {
    return jwt.verify(
        token,
        JWT_SECRET
    );
};

module.exports = {
    signToken,
    verifyToken
};