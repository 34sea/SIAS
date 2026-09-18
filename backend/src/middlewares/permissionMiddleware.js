
const pool = require('../config/db');

const permissionMiddleware = (...permissoesNecessarias) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Utilizador não autenticado.'
                });
            }

            if (!req.user.role_id) {
                return res.status(403).json({
                    success: false,
                    message: 'O utilizador não possui um perfil de acesso definido.'
                });
            }

            if (permissoesNecessarias.length === 0) {
                return next();
            }

            const placeholders = permissoesNecessarias
                .map(() => '?')
                .join(',');

            const [permissoes] = await pool.query(
                `
                SELECT DISTINCT p.codigo
                FROM permissoes p
                INNER JOIN role_permissoes rp
                    ON rp.permissao_id = p.id
                WHERE rp.role_id = ?
                  AND p.codigo IN (${placeholders})
                  AND p.estado = 'ACTIVO'
                `,
                [
                    req.user.role_id,
                    ...permissoesNecessarias
                ]
            );

            const permissoesEncontradas = permissoes.map(
                permissao => permissao.codigo
            );

            const possuiPermissao = permissoesNecessarias.every(
                permissao =>
                    permissoesEncontradas.includes(permissao)
            );

            if (!possuiPermissao) {
                return res.status(403).json({
                    success: false,
                    message: 'Não possui permissões para realizar esta operação.',
                    requiredPermissions: permissoesNecessarias
                });
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = permissionMiddleware;