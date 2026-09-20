// const pool = require('../config/db');
// const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * @swagger
 * tags:
 *   - name: Utilizadores
 *     description: Gestão dos utilizadores do sistema
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     Utilizador:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nome_completo:
 *           type: string
 *           example: "Martinho Domingos"
 *         email:
 *           type: string
 *           format: email
 *           example: "martinho@email.com"
 *         username:
 *           type: string
 *           example: "martinho"
 *         role_id:
 *           type: integer
 *           example: 2
 *         role_nome:
 *           type: string
 *           example: "ESTUDANTE"
 *         estado:
 *           type: integer
 *           description: "1 para ACTIVO, 0 para INACTIVO"
 *           example: 1
 *         foto:
 *           type: string
 *           nullable: true
 *           example: "uploads/users/user-1712345678-123456789.png"
 *         data_criacao:
 *           type: string
 *           format: date-time
 *           example: "2026-09-18T08:30:00.000Z"
 *         data_actualizacao:
 *           type: string
 *           format: date-time
 *           example: "2026-09-18T09:30:00.000Z"
 *
 *     UpdateUserStatusRequest:
 *       type: object
 *       required:
 *         - estado
 *       properties:
 *         estado:
 *           type: integer
 *           description: "1 para ACTIVO, 0 para INACTIVO"
 *           example: 1
 *
 *     UpdateUserPasswordRequest:
 *       type: object
 *       required:
 *         - nova_password_hash
 *       properties:
 *         nova_password_hash:
 *           type: string
 *           format: password
 *           minLength: 6
 *           example: "NovaSenha123"
 *
 *     UsersResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         total:
 *           type: integer
 *           example: 10
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Utilizador'
 *
 *     UserResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/Utilizador'
 *
 *     UserCreatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Utilizador criado com sucesso."
 *         data:
 *           $ref: '#/components/schemas/Utilizador'
 *
 *     UserMessageResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Operação realizada com sucesso."
 *
 *     UserErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Utilizador não encontrado."
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Listar utilizadores
 *     description: Retorna a lista de utilizadores, permitindo pesquisa e filtragem por perfil e estado.
 *     tags: [Utilizadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Pesquisa por nome completo, email ou username.
 *         example: "Martinho"
 *
 *       - in: query
 *         name: role_id
 *         schema:
 *           type: integer
 *         description: Filtra os utilizadores pelo ID do perfil.
 *         example: 2
 *
 *       - in: query
 *         name: estado
 *         schema:
 *           type: integer
 *         description: Filtra pelo estado do utilizador (1 = Ativo, 0 = Inativo).
 *         example: 1
 *
 *     responses:
 *       200:
 *         description: Lista de utilizadores obtida com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsersResponse'
 *
 *       401:
 *         description: Não autenticado ou token inválido.
 */
const getUsers = async (req, res, next) => {
    try {
        const { search = '', role_id, estado } = req.query;

        let sql = `
            SELECT
                u.id,
                u.nome_completo,
                u.email,
                u.username,
                u.role_id,
                r.nome AS role_nome,
                u.ativo AS estado,
                u.foto,
                u.criado_em AS data_criacao,
                u.atualizado_em AS data_actualizacao
            FROM utilizadores u
            INNER JOIN roles r ON r.id = u.role_id
            WHERE 1 = 1
        `;

        const params = [];

        if (search.trim() !== '') {
            sql += `
                AND (
                    u.nome_completo LIKE ?
                    OR u.email LIKE ?
                    OR u.username LIKE ?
                )
            `;
            const searchValue = `%${search.trim()}%`;
            params.push(searchValue, searchValue, searchValue);
        }

        if (role_id) {
            sql += ` AND u.role_id = ? `;
            params.push(role_id);
        }

        if (estado !== undefined) {
            sql += ` AND u.ativo = ? `;
            params.push(estado);
        }

        sql += ` ORDER BY u.criado_em DESC `;

        const [utilizadores] = await pool.query(sql, params);

        return res.status(200).json({
            success: true,
            total: utilizadores.length,
            data: utilizadores
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Consultar utilizador por ID
 *     description: Retorna os dados de um utilizador específico.
 *     tags: [Utilizadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do utilizador.
 *         schema:
 *           type: integer
 *         example: 1
 *
 *     responses:
 *       200:
 *         description: Utilizador encontrado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *
 *       401:
 *         description: Não autenticado ou token inválido.
 *
 *       404:
 *         description: Utilizador não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserErrorResponse'
 */
const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [utilizadores] = await pool.query(
            `
            SELECT
                u.id,
                u.nome_completo,
                u.email,
                u.username,
                u.role_id,
                r.nome AS role_nome,
                u.ativo AS estado,
                u.foto,
                u.criado_em AS data_criacao,
                u.atualizado_em AS data_actualizacao
            FROM utilizadores u
            INNER JOIN roles r ON r.id = u.role_id
            WHERE u.id = ?
            LIMIT 1
            `,
            [id]
        );

        if (utilizadores.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Utilizador não encontrado.'
            });
        }

        return res.status(200).json({
            success: true,
            data: utilizadores[0]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Criar utilizador com upload de foto
 *     description: Cria um novo utilizador no sistema com o envio opcional/obrigatório da foto de perfil.
 *     tags: [Utilizadores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - nome_completo
 *               - email
 *               - username
 *               - password_hash
 *               - role_id
 *             properties:
 *               nome_completo:
 *                 type: string
 *                 example: "Martinho Domingos"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "martinho@email.com"
 *               username:
 *                 type: string
 *                 example: "martinho"
 *               password_hash:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "123456"
 *               role_id:
 *                 type: integer
 *                 example: 2
 *               foto:
 *                 type: string
 *                 format: binary
 *                 description: Ficheiro de imagem da foto de perfil
 *     responses:
 *       201:
 *         description: Utilizador criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserCreatedResponse'
 *       400:
 *         description: Dados inválidos ou perfil inexistente.
 *       401:
 *         description: Não autenticado ou token inválido.
 *       409:
 *         description: Email ou username já registado.
 */
const createUser = async (req, res, next) => {
    try {
        const { nome_completo, email, username, password_hash, role_id } = req.body;

        if (!nome_completo || !email || !username || !password_hash || !role_id) {
            return res.status(400).json({
                success: false,
                message: 'Nome, email, username, palavra-passe e perfil são obrigatórios.'
            });
        }

        if (password_hash.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'A palavra-passe deve conter pelo menos 6 caracteres.'
            });
        }

        const [role] = await pool.query(
            `SELECT id FROM roles WHERE id = ? LIMIT 1`,
            [role_id]
        );

        if (role.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'O perfil informado não existe.'
            });
        }

        const [utilizadorExistente] = await pool.query(
            `SELECT id FROM utilizadores WHERE email = ? OR username = ? LIMIT 1`,
            [email, username]
        );

        if (utilizadorExistente.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'O email ou username já está registado.'
            });
        }

        // Construção do caminho do ficheiro guardado
        let fotoPath = null;
        if (req.file) {
            fotoPath = `uploads/users/${req.file.filename}`;
        }

        const palavraPasseHash = await bcrypt.hash(password_hash, 12);

        const [resultado] = await pool.query(
            `
            INSERT INTO utilizadores (
                nome_completo,
                email,
                username,
                password_hash,
                role_id,
                ativo,
                foto
            )
            VALUES (?, ?, ?, ?, ?, TRUE, ?)
            `,
            [
                nome_completo,
                email,
                username,
                palavraPasseHash,
                role_id,
                fotoPath
            ]
        );

        const [novoUtilizador] = await pool.query(
            `
            SELECT
                u.id,
                u.nome_completo,
                u.email,
                u.username,
                u.role_id,
                r.nome AS role_nome,
                u.ativo AS estado,
                u.foto,
                u.criado_em AS data_criacao,
                u.atualizado_em AS data_actualizacao
            FROM utilizadores u
            INNER JOIN roles r ON r.id = u.role_id
            WHERE u.id = ?
            `,
            [resultado.insertId]
        );

        return res.status(201).json({
            success: true,
            message: 'Utilizador criado com sucesso.',
            data: novoUtilizador[0]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Actualizar utilizador com upload de foto
 *     description: Actualiza os dados de um utilizador existente e permite o upload de uma nova foto.
 *     tags: [Utilizadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do utilizador.
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nome_completo:
 *                 type: string
 *                 example: "Martinho Macovere Domingos"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "martinho@email.com"
 *               username:
 *                 type: string
 *                 example: "martinho"
 *               role_id:
 *                 type: integer
 *                 example: 2
 *               foto:
 *                 type: string
 *                 format: binary
 *                 description: Ficheiro de imagem da nova foto de perfil
 *     responses:
 *       200:
 *         description: Utilizador actualizado com sucesso.
 *       400:
 *         description: Nenhum campo enviado ou perfil inválido.
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Utilizador não encontrado.
 *       409:
 *         description: Email ou username já pertence a outro utilizador.
 */
const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nome_completo, email, username, role_id } = req.body;

        const [utilizadorExistente] = await pool.query(
            `SELECT id FROM utilizadores WHERE id = ? LIMIT 1`,
            [id]
        );

        if (utilizadorExistente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Utilizador não encontrado.'
            });
        }

        if (role_id) {
            const [role] = await pool.query(
                `SELECT id FROM roles WHERE id = ? LIMIT 1`,
                [role_id]
            );

            if (role.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'O perfil informado não existe.'
                });
            }
        }

        if (email || username) {
            const [duplicado] = await pool.query(
                `
                SELECT id
                FROM utilizadores
                WHERE (email = ? OR username = ?)
                  AND id <> ?
                LIMIT 1
                `,
                [email || '', username || '', id]
            );

            if (duplicado.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'O email ou username já pertence a outro utilizador.'
                });
            }
        }

        const campos = [];
        const valores = [];

        if (nome_completo !== undefined) {
            campos.push('nome_completo = ?');
            valores.push(nome_completo);
        }

        if (email !== undefined) {
            campos.push('email = ?');
            valores.push(email);
        }

        if (username !== undefined) {
            campos.push('username = ?');
            valores.push(username);
        }

        if (role_id !== undefined) {
            campos.push('role_id = ?');
            valores.push(role_id);
        }

        if (req.file) {
            const fotoPath = `uploads/users/${req.file.filename}`;
            campos.push('foto = ?');
            valores.push(fotoPath);
        }

        if (campos.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum campo foi enviado para actualização.'
            });
        }

        valores.push(id);

        await pool.query(
            `
            UPDATE utilizadores
            SET ${campos.join(', ')}
            WHERE id = ?
            `,
            valores
        );

        const [utilizadorActualizado] = await pool.query(
            `
            SELECT
                u.id,
                u.nome_completo,
                u.email,
                u.username,
                u.role_id,
                r.nome AS role_nome,
                u.ativo AS estado,
                u.foto,
                u.criado_em AS data_criacao,
                u.atualizado_em AS data_actualizacao
            FROM utilizadores u
            INNER JOIN roles r ON r.id = u.role_id
            WHERE u.id = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: 'Utilizador actualizado com sucesso.',
            data: utilizadorActualizado[0]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: Activar ou desactivar utilizador
 *     description: Altera o estado de um utilizador (1 para Activo, 0 para Inactivo).
 *     tags: [Utilizadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do utilizador.
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserStatusRequest'
 *     responses:
 *       200:
 *         description: Estado actualizado com sucesso.
 *       400:
 *         description: Estado inválido.
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Utilizador não encontrado.
 */
const updateUserStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (estado === undefined || ![0, 1, true, false].includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'O estado deve ser um valor booleano ou 1/0.'
            });
        }

        const [utilizador] = await pool.query(
            `SELECT id FROM utilizadores WHERE id = ? LIMIT 1`,
            [id]
        );

        if (utilizador.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Utilizador não encontrado.'
            });
        }

        const ativoValue = estado === 1 || estado === true ? 1 : 0;

        await pool.query(
            `UPDATE utilizadores SET ativo = ? WHERE id = ?`,
            [ativoValue, id]
        );

        return res.status(200).json({
            success: true,
            message: `Utilizador ${ativoValue ? 'activado' : 'desactivado'} com sucesso.`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/users/{id}/password:
 *   patch:
 *     summary: Alterar palavra-passe de um utilizador
 *     description: Permite alterar a palavra-passe de um utilizador específico.
 *     tags: [Utilizadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do utilizador.
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserPasswordRequest'
 *     responses:
 *       200:
 *         description: Palavra-passe alterada com sucesso.
 *       400:
 *         description: Palavra-passe inválida.
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Utilizador não encontrado.
 */
const updateUserPassword = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nova_password_hash } = req.body;

        if (!nova_password_hash) {
            return res.status(400).json({
                success: false,
                message: 'A nova palavra-passe é obrigatória.'
            });
        }

        if (nova_password_hash.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'A palavra-passe deve conter pelo menos 6 caracteres.'
            });
        }

        const [utilizador] = await pool.query(
            `SELECT id FROM utilizadores WHERE id = ? LIMIT 1`,
            [id]
        );

        if (utilizador.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Utilizador não encontrado.'
            });
        }

        const palavraPasseHash = await bcrypt.hash(nova_password_hash, 12);

        await pool.query(
            `UPDATE utilizadores SET password_hash = ? WHERE id = ?`,
            [palavraPasseHash, id]
        );

        return res.status(200).json({
            success: true,
            message: 'Palavra-passe alterada com sucesso.'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Eliminar utilizador
 *     description: Remove permanentemente um utilizador do sistema. Um utilizador não pode eliminar a própria conta.
 *     tags: [Utilizadores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do utilizador.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Utilizador eliminado com sucesso.
 *       400:
 *         description: O utilizador tentou eliminar a própria conta.
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Utilizador não encontrado.
 */
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (Number(req.user.id) === Number(id)) {
            return res.status(400).json({
                success: false,
                message: 'Não pode eliminar a sua própria conta.'
            });
        }

        const [utilizador] = await pool.query(
            `SELECT id FROM utilizadores WHERE id = ? LIMIT 1`,
            [id]
        );

        if (utilizador.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Utilizador não encontrado.'
            });
        }

        await pool.query(`DELETE FROM utilizadores WHERE id = ?`, [id]);

        return res.status(200).json({
            success: true,
            message: 'Utilizador eliminado com sucesso.'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    updateUserStatus,
    updateUserPassword,
    deleteUser
};
// /**
//  * @swagger
//  * tags:
//  *   - name: Utilizadores
//  *     description: Gestão dos utilizadores do sistema
//  */

// /**
//  * @swagger
//  * components:
//  *   schemas:
//  *
//  *     Utilizador:
//  *       type: object
//  *       properties:
//  *         id:
//  *           type: integer
//  *           example: 1
//  *         nome_completo:
//  *           type: string
//  *           example: "Martinho Domingos"
//  *         email:
//  *           type: string
//  *           format: email
//  *           example: "martinho@email.com"
//  *         username:
//  *           type: string
//  *           example: "martinho"
//  *         role_id:
//  *           type: integer
//  *           example: 2
//  *         role_nome:
//  *           type: string
//  *           example: "ESTUDANTE"
//  *         estado:
//  *           type: string
//  *           enum: [ACTIVO, INACTIVO]
//  *           example: "ACTIVO"
//  *         foto:
//  *           type: string
//  *           nullable: true
//  *           example: "uploads/users/foto.png"
//  *         data_criacao:
//  *           type: string
//  *           format: date-time
//  *           example: "2026-09-18T08:30:00.000Z"
//  *         data_actualizacao:
//  *           type: string
//  *           format: date-time
//  *           example: "2026-09-18T09:30:00.000Z"
//  *
//  *     CreateUserRequest:
//  *       type: object
//  *       required:
//  *         - nome_completo
//  *         - email
//  *         - username
//  *         - password_hash
//  *         - role_id
//  *       properties:
//  *         nome_completo:
//  *           type: string
//  *           example: "Martinho Domingos"
//  *         email:
//  *           type: string
//  *           format: email
//  *           example: "martinho@email.com"
//  *         username:
//  *           type: string
//  *           example: "martinho"
//  *         password_hash:
//  *           type: string
//  *           format: password
//  *           minLength: 6
//  *           example: "123456"
//  *         role_id:
//  *           type: integer
//  *           example: 2
//  *         foto:
//  *           type: string
//  *           nullable: true
//  *           example: "uploads/users/foto.png"
//  *
//  *     UpdateUserRequest:
//  *       type: object
//  *       properties:
//  *         nome_completo:
//  *           type: string
//  *           example: "Martinho Macovere Domingos"
//  *         email:
//  *           type: string
//  *           format: email
//  *           example: "martinho@email.com"
//  *         username:
//  *           type: string
//  *           example: "martinho"
//  *         role_id:
//  *           type: integer
//  *           example: 2
//  *         foto:
//  *           type: string
//  *           nullable: true
//  *           example: "uploads/users/foto.png"
//  *
//  *     UpdateUserStatusRequest:
//  *       type: object
//  *       required:
//  *         - estado
//  *       properties:
//  *         estado:
//  *           type: string
//  *           enum: [ACTIVO, INACTIVO]
//  *           example: "ACTIVO"
//  *
//  *     UpdateUserPasswordRequest:
//  *       type: object
//  *       required:
//  *         - nova_password_hash
//  *       properties:
//  *         nova_password_hash:
//  *           type: string
//  *           format: password
//  *           minLength: 6
//  *           example: "NovaSenha123"
//  *
//  *     UsersResponse:
//  *       type: object
//  *       properties:
//  *         success:
//  *           type: boolean
//  *           example: true
//  *         total:
//  *           type: integer
//  *           example: 10
//  *         data:
//  *           type: array
//  *           items:
//  *             $ref: '#/components/schemas/Utilizador'
//  *
//  *     UserResponse:
//  *       type: object
//  *       properties:
//  *         success:
//  *           type: boolean
//  *           example: true
//  *         data:
//  *           $ref: '#/components/schemas/Utilizador'
//  *
//  *     UserCreatedResponse:
//  *       type: object
//  *       properties:
//  *         success:
//  *           type: boolean
//  *           example: true
//  *         message:
//  *           type: string
//  *           example: "Utilizador criado com sucesso."
//  *         data:
//  *           $ref: '#/components/schemas/Utilizador'
//  *
//  *     UserMessageResponse:
//  *       type: object
//  *       properties:
//  *         success:
//  *           type: boolean
//  *           example: true
//  *         message:
//  *           type: string
//  *           example: "Operação realizada com sucesso."
//  *
//  *     UserErrorResponse:
//  *       type: object
//  *       properties:
//  *         success:
//  *           type: boolean
//  *           example: false
//  *         message:
//  *           type: string
//  *           example: "Utilizador não encontrado."
//  */


// /**
//  * @swagger
//  * /api/users:
//  *   get:
//  *     summary: Listar utilizadores
//  *     description: Retorna a lista de utilizadores, permitindo pesquisa e filtragem por perfil e estado.
//  *     tags: [Utilizadores]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: search
//  *         schema:
//  *           type: string
//  *         description: Pesquisa por nome completo, email ou username.
//  *         example: "Martinho"
//  *
//  *       - in: query
//  *         name: role_id
//  *         schema:
//  *           type: integer
//  *         description: Filtra os utilizadores pelo ID do perfil.
//  *         example: 2
//  *
//  *       - in: query
//  *         name: estado
//  *         schema:
//  *           type: string
//  *           enum: [ACTIVO, INACTIVO]
//  *         description: Filtra os utilizadores pelo estado.
//  *         example: ACTIVO
//  *
//  *     responses:
//  *       200:
//  *         description: Lista de utilizadores obtida com sucesso.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/UsersResponse'
//  *
//  *       401:
//  *         description: Não autenticado ou token inválido.
//  */
// const getUsers = async (req, res, next) => {
//     try {
//         const {
//             search = '',
//             role_id,
//             estado
//         } = req.query;

//         let sql = `
//             SELECT
//                 u.id,
//                 u.nome_completo,
//                 u.email,
//                 u.username,
//                 u.role_id,
//                 r.nome AS role_nome,
//                 u.ativo,
//                 u.foto,
//                 u.data_criacao,
//                 u.data_actualizacao
//             FROM utilizadores u
//             INNER JOIN roles r ON r.id = u.role_id
//             WHERE 1 = 1
//         `;

//         const params = [];

//         if (search.trim() !== '') {
//             sql += `
//                 AND (
//                     u.nome_completo LIKE ?
//                     OR u.email LIKE ?
//                     OR u.username LIKE ?
//                 )
//             `;

//             const searchValue = `%${search.trim()}%`;

//             params.push(
//                 searchValue,
//                 searchValue,
//                 searchValue
//             );
//         }

//         if (role_id) {
//             sql += ` AND u.role_id = ? `;
//             params.push(role_id);
//         }

//         if (estado) {
//             sql += ` AND u.ativo = ? `;
//             params.push(estado);
//         }

//         sql += ` ORDER BY u.data_criacao DESC `;

//         const [utilizadores] = await pool.query(sql, params);

//         return res.status(200).json({
//             success: true,
//             total: utilizadores.length,
//             data: utilizadores
//         });
//     } catch (error) {
//         next(error);
//     }
// };


// /**
//  * @swagger
//  * /api/users/{id}:
//  *   get:
//  *     summary: Consultar utilizador por ID
//  *     description: Retorna os dados de um utilizador específico.
//  *     tags: [Utilizadores]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         description: ID do utilizador.
//  *         schema:
//  *           type: integer
//  *         example: 1
//  *
//  *     responses:
//  *       200:
//  *         description: Utilizador encontrado com sucesso.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/UserResponse'
//  *
//  *       401:
//  *         description: Não autenticado ou token inválido.
//  *
//  *       404:
//  *         description: Utilizador não encontrado.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/UserErrorResponse'
//  */
// const getUserById = async (req, res, next) => {
//     try {
//         const { id } = req.params;

//         const [utilizadores] = await pool.query(
//             `
//             SELECT
//                 u.id,
//                 u.nome_completo,
//                 u.email,
//                 u.username,
//                 u.role_id,
//                 r.nome AS role_nome,
//                 u.ativo,
//                 u.foto,
//                 u.data_criacao,
//                 u.data_actualizacao
//             FROM utilizadores u
//             INNER JOIN roles r ON r.id = u.role_id
//             WHERE u.id = ?
//             LIMIT 1
//             `,
//             [id]
//         );

//         if (utilizadores.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Utilizador não encontrado.'
//             });
//         }

//         return res.status(200).json({
//             success: true,
//             data: utilizadores[0]
//         });
//     } catch (error) {
//         next(error);
//     }
// };


// /**
//  * @swagger
//  * /api/users:
//  *   post:
//  *     summary: Criar utilizador
//  *     description: Cria um novo utilizador no sistema. A palavra-passe é armazenada de forma encriptada.
//  *     tags: [Utilizadores]
//  *     security:
//  *       - bearerAuth: []
//  *
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/CreateUserRequest'
//  *
//  *     responses:
//  *       201:
//  *         description: Utilizador criado com sucesso.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/UserCreatedResponse'
//  *
//  *       400:
//  *         description: Dados inválidos ou perfil inexistente.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/UserErrorResponse'
//  *
//  *       401:
//  *         description: Não autenticado ou token inválido.
//  *
//  *       409:
//  *         description: Email ou username já registado.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/UserErrorResponse'
//  */
// const createUser = async (req, res, next) => {
//     try {
//         const {
//             nome_completo,
//             email,
//             username,
//             password_hash,
//             role_id,
//             foto = null
//         } = req.body;

//         if (
//             !nome_completo ||
//             !email ||
//             !username ||
//             !password_hash ||
//             !role_id
//         ) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Nome, email, username, palavra-passe e perfil são obrigatórios.'
//             });
//         }

//         if (password_hash.length < 6) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'A palavra-passe deve conter pelo menos 6 caracteres.'
//             });
//         }

//         const [role] = await pool.query(
//             `
//             SELECT id
//             FROM roles
//             WHERE id = ?
//             LIMIT 1
//             `,
//             [role_id]
//         );

//         if (role.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'O perfil informado não existe.'
//             });
//         }

//         const [utilizadorExistente] = await pool.query(
//             `
//             SELECT id
//             FROM utilizadores
//             WHERE email = ?
//                OR username = ?
//             LIMIT 1
//             `,
//             [email, username]
//         );

//         if (utilizadorExistente.length > 0) {
//             return res.status(409).json({
//                 success: false,
//                 message: 'O email ou username já está registado.'
//             });
//         }

//         const palavraPasseHash = await bcrypt.hash(
//             password_hash,
//             12
//         );

//         const [resultado] = await pool.query(
//             `
//             INSERT INTO utilizadores (
//                 nome_completo,
//                 email,
//                 username,
//                 password_hash,
//                 role_id,
//                 estado,
//                 foto
//             )
//             VALUES (?, ?, ?, ?, ?, 'ACTIVO', ?)
//             `,
//             [
//                 nome_completo,
//                 email,
//                 username,
//                 palavraPasseHash,
//                 role_id,
//                 foto
//             ]
//         );

//         const [novoUtilizador] = await pool.query(
//             `
//             SELECT
//                 u.id,
//                 u.nome_completo,
//                 u.email,
//                 u.username,
//                 u.role_id,
//                 r.nome AS role_nome,
//                 u.ativo,
//                 u.foto,
//                 u.data_criacao
//             FROM utilizadores u
//             INNER JOIN roles r ON r.id = u.role_id
//             WHERE u.id = ?
//             `,
//             [resultado.insertId]
//         );

//         return res.status(201).json({
//             success: true,
//             message: 'Utilizador criado com sucesso.',
//             data: novoUtilizador[0]
//         });
//     } catch (error) {
//         next(error);
//     }
// };


// /**
//  * @swagger
//  * /api/users/{id}:
//  *   put:
//  *     summary: Actualizar utilizador
//  *     description: Actualiza os dados de um utilizador existente. Apenas os campos enviados serão alterados.
//  *     tags: [Utilizadores]
//  *     security:
//  *       - bearerAuth: []
//  *
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         description: ID do utilizador.
//  *         schema:
//  *           type: integer
//  *         example: 1
//  *
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/UpdateUserRequest'
//  *
//  *     responses:
//  *       200:
//  *         description: Utilizador actualizado com sucesso.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/UserCreatedResponse'
//  *
//  *       400:
//  *         description: Nenhum campo enviado ou perfil inválido.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/UserErrorResponse'
//  *
//  *       401:
//  *         description: Não autenticado ou token inválido.
//  *
//  *       404:
//  *         description: Utilizador não encontrado.
//  *
//  *       409:
//  *         description: Email ou username já pertence a outro utilizador.
//  */
// const updateUser = async (req, res, next) => {
//     try {
//         const { id } = req.params;

//         const {
//             nome_completo,
//             email,
//             username,
//             role_id,
//             foto
//         } = req.body;

//         const [utilizadorExistente] = await pool.query(
//             `
//             SELECT id
//             FROM utilizadores
//             WHERE id = ?
//             LIMIT 1
//             `,
//             [id]
//         );

//         if (utilizadorExistente.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Utilizador não encontrado.'
//             });
//         }

//         if (role_id) {
//             const [role] = await pool.query(
//                 `
//                 SELECT id
//                 FROM roles
//                 WHERE id = ?
//                 LIMIT 1
//                 `,
//                 [role_id]
//             );

//             if (role.length === 0) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'O perfil informado não existe.'
//                 });
//             }
//         }

//         if (email || username) {
//             const [duplicado] = await pool.query(
//                 `
//                 SELECT id
//                 FROM utilizadores
//                 WHERE (email = ? OR username = ?)
//                   AND id <> ?
//                 LIMIT 1
//                 `,
//                 [
//                     email || '',
//                     username || '',
//                     id
//                 ]
//             );

//             if (duplicado.length > 0) {
//                 return res.status(409).json({
//                     success: false,
//                     message: 'O email ou username já pertence a outro utilizador.'
//                 });
//             }
//         }

//         const campos = [];
//         const valores = [];

//         if (nome_completo !== undefined) {
//             campos.push('nome_completo = ?');
//             valores.push(nome_completo);
//         }

//         if (email !== undefined) {
//             campos.push('email = ?');
//             valores.push(email);
//         }

//         if (username !== undefined) {
//             campos.push('username = ?');
//             valores.push(username);
//         }

//         if (role_id !== undefined) {
//             campos.push('role_id = ?');
//             valores.push(role_id);
//         }

//         if (foto !== undefined) {
//             campos.push('foto = ?');
//             valores.push(foto);
//         }

//         if (campos.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Nenhum campo foi enviado para actualização.'
//             });
//         }

//         campos.push('data_actualizacao = CURRENT_TIMESTAMP');

//         valores.push(id);

//         await pool.query(
//             `
//             UPDATE utilizadores
//             SET ${campos.join(', ')}
//             WHERE id = ?
//             `,
//             valores
//         );

//         const [utilizadorActualizado] = await pool.query(
//             `
//             SELECT
//                 u.id,
//                 u.nome_completo,
//                 u.email,
//                 u.username,
//                 u.role_id,
//                 r.nome AS role_nome,
//                 u.ativo,
//                 u.foto,
//                 u.data_criacao,
//                 u.data_actualizacao
//             FROM utilizadores u
//             INNER JOIN roles r ON r.id = u.role_id
//             WHERE u.id = ?
//             `,
//             [id]
//         );

//         return res.status(200).json({
//             success: true,
//             message: 'Utilizador actualizado com sucesso.',
//             data: utilizadorActualizado[0]
//         });
//     } catch (error) {
//         next(error);
//     }
// };


// /**
//  * @swagger
//  * /api/users/{id}/status:
//  *   patch:
//  *     summary: Activar ou desactivar utilizador
//  *     description: Altera o estado de um utilizador para ACTIVO ou INACTIVO.
//  *     tags: [Utilizadores]
//  *     security:
//  *       - bearerAuth: []
//  *
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         description: ID do utilizador.
//  *         schema:
//  *           type: integer
//  *         example: 1
//  *
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/UpdateUserStatusRequest'
//  *
//  *     responses:
//  *       200:
//  *         description: Estado actualizado com sucesso.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/UserMessageResponse'
//  *
//  *       400:
//  *         description: Estado inválido.
//  *
//  *       401:
//  *         description: Não autenticado ou token inválido.
//  *
//  *       404:
//  *         description: Utilizador não encontrado.
//  */
// const updateUserStatus = async (req, res, next) => {
//     try {
//         const { id } = req.params;
//         const { estado } = req.body;

//         if (!['ACTIVO', 'INACTIVO'].includes(estado)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'O estado deve ser ACTIVO ou INACTIVO.'
//             });
//         }

//         const [utilizador] = await pool.query(
//             `
//             SELECT id
//             FROM utilizadores
//             WHERE id = ?
//             LIMIT 1
//             `,
//             [id]
//         );

//         if (utilizador.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Utilizador não encontrado.'
//             });
//         }

//         await pool.query(
//             `
//             UPDATE utilizadores
//             SET estado = ?,
//                 data_actualizacao = CURRENT_TIMESTAMP
//             WHERE id = ?
//             `,
//             [estado, id]
//         );

//         return res.status(200).json({
//             success: true,
//             message: `Utilizador ${estado === 'ACTIVO' ? 'activado' : 'desactivado'} com sucesso.`
//         });
//     } catch (error) {
//         next(error);
//     }
// };


// /**
//  * @swagger
//  * /api/users/{id}/password:
//  *   patch:
//  *     summary: Alterar palavra-passe de um utilizador
//  *     description: Permite alterar a palavra-passe de um utilizador específico.
//  *     tags: [Utilizadores]
//  *     security:
//  *       - bearerAuth: []
//  *
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         description: ID do utilizador.
//  *         schema:
//  *           type: integer
//  *         example: 1
//  *
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/UpdateUserPasswordRequest'
//  *
//  *     responses:
//  *       200:
//  *         description: Palavra-passe alterada com sucesso.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/UserMessageResponse'
//  *
//  *       400:
//  *         description: Palavra-passe inválida.
//  *
//  *       401:
//  *         description: Não autenticado ou token inválido.
//  *
//  *       404:
//  *         description: Utilizador não encontrado.
//  */
// const updateUserPassword = async (req, res, next) => {
//     try {
//         const { id } = req.params;
//         const { nova_password_hash } = req.body;

//         if (!nova_password_hash) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'A nova palavra-passe é obrigatória.'
//             });
//         }

//         if (nova_password_hash.length < 6) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'A palavra-passe deve conter pelo menos 6 caracteres.'
//             });
//         }

//         const [utilizador] = await pool.query(
//             `
//             SELECT id
//             FROM utilizadores
//             WHERE id = ?
//             LIMIT 1
//             `,
//             [id]
//         );

//         if (utilizador.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Utilizador não encontrado.'
//             });
//         }

//         const palavraPasseHash = await bcrypt.hash(
//             nova_password_hash,
//             12
//         );

//         await pool.query(
//             `
//             UPDATE utilizadores
//             SET password_hash = ?,
//                 data_actualizacao = CURRENT_TIMESTAMP
//             WHERE id = ?
//             `,
//             [palavraPasseHash, id]
//         );

//         return res.status(200).json({
//             success: true,
//             message: 'Palavra-passe alterada com sucesso.'
//         });
//     } catch (error) {
//         next(error);
//     }
// };


// /**
//  * @swagger
//  * /api/users/{id}:
//  *   delete:
//  *     summary: Eliminar utilizador
//  *     description: Remove permanentemente um utilizador do sistema. Um utilizador não pode eliminar a própria conta.
//  *     tags: [Utilizadores]
//  *     security:
//  *       - bearerAuth: []
//  *
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         description: ID do utilizador.
//  *         schema:
//  *           type: integer
//  *         example: 1
//  *
//  *     responses:
//  *       200:
//  *         description: Utilizador eliminado com sucesso.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/UserMessageResponse'
//  *
//  *       400:
//  *         description: O utilizador tentou eliminar a própria conta.
//  *
//  *       401:
//  *         description: Não autenticado ou token inválido.
//  *
//  *       404:
//  *         description: Utilizador não encontrado.
//  */
// const deleteUser = async (req, res, next) => {
//     try {
//         const { id } = req.params;

//         if (Number(req.user.id) === Number(id)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Não pode eliminar a sua própria conta.'
//             });
//         }

//         const [utilizador] = await pool.query(
//             `
//             SELECT id
//             FROM utilizadores
//             WHERE id = ?
//             LIMIT 1
//             `,
//             [id]
//         );

//         if (utilizador.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Utilizador não encontrado.'
//             });
//         }

//         await pool.query(
//             `
//             DELETE FROM utilizadores
//             WHERE id = ?
//             `,
//             [id]
//         );

//         return res.status(200).json({
//             success: true,
//             message: 'Utilizador eliminado com sucesso.'
//         });
//     } catch (error) {
//         next(error);
//     }
// };


// module.exports = {
//     getUsers,
//     getUserById,
//     createUser,
//     updateUser,
//     updateUserStatus,
//     updateUserPassword,
//     deleteUser
// };