// require('dotenv').config();

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const createAdmin = async () => {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'rootpassword',
            database: process.env.DB_NAME || 'SIAS'
        });

        console.log('Ligado à base de dados.');

        const [roles] = await connection.query(
            `
            SELECT id
            FROM roles
            WHERE nome = 'ADMIN'
            LIMIT 1
            `
        );

        if (roles.length === 0) {
            console.error(
                'ERRO: O role ADMIN não existe na tabela roles.'
            );

            process.exit(1);
        }

        const adminRoleId = roles[0].id;

        const [admins] = await connection.query(
            `
            SELECT id, email, username
            FROM utilizadores
            WHERE role_id = ?
            LIMIT 1
            `,
            [adminRoleId]
        );

        if (admins.length > 0) {
            console.log(
                `Já existe um administrador: ${admins[0].username}`
            );

            process.exit(0);
        }

        const nome = 'Administrador do Sistema';
        const email = 'admin@similaridade.co.mz';
        const username = 'admin';
        const palavraPasse = 'Admin@123456';

        const [utilizadorExistente] = await connection.query(
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
            console.error(
                'ERRO: O email ou username já está em uso.'
            );

            process.exit(1);
        }

        const palavraPasseHash = await bcrypt.hash(
            palavraPasse,
            12
        );

        const [resultado] = await connection.query(
            `
            INSERT INTO utilizadores (
                nome_completo,
                email,
                username,
                password_hash,
                role_id,
                estado
            )
            VALUES (?, ?, ?, ?, ?, '1')
            `,
            [
                nome,
                email,
                username,
                palavraPasseHash,
                adminRoleId
            ]
        );

        console.log('');
        console.log('======================================');
        console.log(' ADMINISTRADOR CRIADO COM SUCESSO');
        console.log('======================================');
        console.log(`ID:       ${resultado.insertId}`);
        console.log(`Username: ${username}`);
        console.log(`Email:    ${email}`);
        console.log(`Senha:    ${palavraPasse}`);
        console.log('======================================');
        console.log('');

        process.exit(0);

    } catch (error) {
        console.error(
            'Erro ao criar administrador:',
            error.message
        );

        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

createAdmin();