const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const createAdmin = async (req, res) => {

    console.log('');
    console.log('======================================');
    console.log('>>> CREATE ADMIN CONTROLLER');
    console.log('======================================');
    console.log('Método:', req.method);
    console.log('URL:', req.originalUrl);
    console.log('IP:', req.ip);
    console.log('User-Agent:', req.headers['user-agent']);
    console.log('Body:', req.body);
    console.log('User:', req.user || 'SEM AUTENTICAÇÃO');
    console.log('======================================');

    try {

        console.log('>>> Verificando role ADMIN...');

        const [roles] = await pool.query(
            `
            SELECT id
            FROM roles
            WHERE nome = 'ADMIN'
            LIMIT 1
            `
        );

        console.log('>>> Roles encontradas:', roles.length);

        if (roles.length === 0) {

            console.log('❌ Role ADMIN não encontrada');

            return res.status(500).json({
                success: false,
                message: 'O role ADMIN não existe na tabela roles.'
            });
        }

        const adminRoleId = roles[0].id;

        console.log('>>> ADMIN role ID:', adminRoleId);
        // Verificar se já existe um administrador
        const [admins] = await pool.query(
            `
            SELECT id, email, username
            FROM utilizadores
            WHERE role_id = ?
            LIMIT 1
            `,
            [adminRoleId]
        );

        if (admins.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Já existe um administrador no sistema.',
                admin: {
                    id: admins[0].id,
                    username: admins[0].username,
                    email: admins[0].email
                }
            });
        }

        const nome = 'Administrador do Sistema';
        const email = 'admin@similaridade.co.mz';
        const username = 'admin';
        const palavraPasse = 'Admin@123456';

        // Verificar se email ou username já existem
        const [utilizadorExistente] = await pool.query(
            `
            SELECT id
            FROM utilizadores
            WHERE email = ?
               OR username = ?
            LIMIT 1
            `,
            [email, username]
        );

        if (utilizadorExistente.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'O email ou username já está em uso.'
            });
        }

        // Gerar hash da palavra-passe
        const palavraPasseHash = await bcrypt.hash(
            palavraPasse,
            12
        );

        const [resultado] = await pool.query(
            `
            INSERT INTO utilizadores (
                nome_completo,
                email,
                username,
                password_hash,
                role_id,
                ativo
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                nome,
                email,
                username,
                palavraPasseHash,
                adminRoleId,
                1 
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Administrador criado com sucesso.',
            data: {
                id: resultado.insertId,
                nome_completo: nome,
                username,
                email,
                password_hash: palavraPasse
            }
        });

    } catch (error) {
        console.error(
            'Erro ao criar administrador:',
            error
        );

        return res.status(500).json({
            success: false,
            message: 'Erro interno ao criar administrador.'
        });
    }
};

module.exports = {
    createAdmin
};