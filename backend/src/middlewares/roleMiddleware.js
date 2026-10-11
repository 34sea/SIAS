const roleMiddleware = (...rolesPermitidos) => {
    return (req, res, next) => {
        try {

            console.log("Call function here")
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Utilizador não autenticado.'
                });
            }

            const role = req.user.role_nome || req.user.role;

            if (!role) {
                return res.status(403).json({
                    success: false,
                    message: 'O utilizador não possui um perfil de acesso definido.'
                });
            }

            if (!rolesPermitidos.includes(role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Não possui permissões para realizar esta operação.'
                });
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = roleMiddleware;