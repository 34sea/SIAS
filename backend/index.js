const app = require('./src/app');
const pool = require('./src/config/db');
const bcrypt = require('bcryptjs');

const PORT = process.env.PORT || 5000;

async function ensureAdmin() {
    try {
        const [roles] = await pool.query(
            `SELECT id FROM roles WHERE nome = 'ADMIN' LIMIT 1`
        );
        if (roles.length === 0) {
            console.log('⚠️  Role ADMIN não encontrada. Pulando criação do admin.');
            return;
        }
        const adminRoleId = roles[0].id;

        const [admins] = await pool.query(
            `SELECT id FROM utilizadores WHERE role_id = ? LIMIT 1`,
            [adminRoleId]
        );
        if (admins.length > 0) {
            console.log('✅ Administrador já existe no sistema.');
            return;
        }

        const nome = 'Administrador do Sistema';
        const email = 'admin@similaridade.co.mz';
        const username = 'admin';
        const palavraPasse = 'Admin@123456';
        const palavraPasseHash = await bcrypt.hash(palavraPasse, 12);

        await pool.query(
            `INSERT INTO utilizadores (nome_completo, email, username, password_hash, role_id, ativo)
             VALUES (?, ?, ?, ?, ?, TRUE)`,
            [nome, email, username, palavraPasseHash, adminRoleId]
        );
        console.log('✅ Administrador criado com sucesso.');
        console.log(`   Email: ${email}`);
        console.log(`   Senha: ${palavraPasse}`);
    } catch (error) {
        console.error('❌ Erro ao garantir administrador:', error.message);
    }
}

async function startServer() {
    try {
        const connection = await pool.getConnection();
        console.log('Conexão com o MySQL estabelecida com sucesso!');
        connection.release();

        await ensureAdmin();

        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
            console.log(`Swagger UI disponível em http://localhost:${PORT}/api-docs`);
        });
    } catch (err) {
        console.error('Erro ao conectar no MySQL. Tentando novamente em 5s...', err.message);
        setTimeout(startServer, 5000);
    }
}

startServer();
