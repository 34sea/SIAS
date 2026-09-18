const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { signToken } = require('../utils/jwt');

/**
 * @swagger
 * tags:
 *   - name: Autenticação
 *     description: Autenticação e gestão da sessão dos utilizadores
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Utilizador:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nome_completo:
 *           type: string
 *           example: "João Manuel"
 *         email:
 *           type: string
 *           format: email
 *           example: "joao@email.com"
 *         username:
 *           type: string
 *           example: "joao.manuel"
 *         role_id:
 *           type: integer
 *           example: 2
 *         role_nome:
 *           type: string
 *           example: "ESTUDANTE"
 *         estado:
 *           type: string
 *           example: "ACTIVO"
 *         foto:
 *           type: string
 *           nullable: true
 *           example: "/uploads/fotos/joao.jpg"
 *         data_criacao:
 *           type: string
 *           format: date-time
 *           example: "2026-09-18T08:30:00.000Z"
 *         data_actualizacao:
 *           type: string
 *           format: date-time
 *           example: "2026-09-18T09:00:00.000Z"
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - identificador
 *         - palavra_passe
 *       properties:
 *         identificador:
 *           type: string
 *           description: Email ou username do utilizador
 *           example: "estudante@email.com"
 *         palavra_passe:
 *           type: string
 *           format: password
 *           example: "123456"
 *
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - palavra_passe_actual
 *         - nova_palavra_passe
 *       properties:
 *         palavra_passe_actual:
 *           type: string
 *           format: password
 *           example: "123456"
 *         nova_palavra_passe:
 *           type: string
 *           format: password
 *           example: "NovaSenha123"
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Credenciais inválidas."
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autenticar utilizador
 *     description: Permite autenticar um utilizador utilizando o email ou username e a palavra-passe.
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login efectuado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login efectuado com sucesso."
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     utilizador:
 *                       $ref: '#/components/schemas/Utilizador'
 *       400:
 *         description: Dados obrigatórios não fornecidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Conta inactiva
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
const login = async (req, res, next) => {
    try {
        const { identificador, palavra_passe } = req.body;

        if (!identificador || !palavra_passe) {
            return res.status(400).json({
                success: false,
                message: 'O identificador e a palavra-passe são obrigatórios.'
            });
        }

        const [utilizadores] = await pool.query(
            `
            SELECT
                u.id,
                u.nome_completo,
                u.email,
                u.username,
                u.palavra_passe,
                u.role_id,
                u.estado,
                u.foto,
                r.nome AS role_nome
            FROM utilizadores u
            INNER JOIN roles r ON r.id = u.role_id
            WHERE u.email = ?
               OR u.username = ?
            LIMIT 1
            `,
            [identificador, identificador]
        );

        if (utilizadores.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas.'
            });
        }

        const utilizador = utilizadores[0];

        if (utilizador.estado !== 'ACTIVO') {
            return res.status(403).json({
                success: false,
                message: 'A sua conta encontra-se inactiva.'
            });
        }

        const palavraPasseValida = await bcrypt.compare(
            palavra_passe,
            utilizador.palavra_passe
        );

        if (!palavraPasseValida) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas.'
            });
        }

        const payload = {
            id: utilizador.id,
            nome_completo: utilizador.nome_completo,
            email: utilizador.email,
            username: utilizador.username,
            role_id: utilizador.role_id,
            role_nome: utilizador.role_nome
        };

        const token = signToken(payload);

        delete utilizador.palavra_passe;

        return res.status(200).json({
            success: true,
            message: 'Login efectuado com sucesso.',
            data: {
                token,
                utilizador
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obter dados do utilizador autenticado
 *     description: Retorna os dados do utilizador associado ao token JWT enviado na requisição.
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do utilizador obtidos com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Utilizador'
 *       401:
 *         description: Não autenticado ou token inválido
 *       404:
 *         description: Utilizador não encontrado
 */
const me = async (req, res, next) => {
    try {
        const utilizadorId = req.user.id;

        const [utilizadores] = await pool.query(
            `
            SELECT
                u.id,
                u.nome_completo,
                u.email,
                u.username,
                u.role_id,
                r.nome AS role_nome,
                u.estado,
                u.foto,
                u.data_criacao,
                u.data_actualizacao
            FROM utilizadores u
            INNER JOIN roles r ON r.id = u.role_id
            WHERE u.id = ?
            LIMIT 1
            `,
            [utilizadorId]
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
 * /api/auth/change-password:
 *   put:
 *     summary: Alterar palavra-passe
 *     description: Permite ao utilizador autenticado alterar a sua palavra-passe.
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Palavra-passe alterada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Palavra-passe alterada com sucesso."
 *       400:
 *         description: Dados inválidos ou palavra-passe actual incorrecta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido
 *       404:
 *         description: Utilizador não encontrado
 */
const changePassword = async (req, res, next) => {
    try {
        const utilizadorId = req.user.id;

        const {
            palavra_passe_actual,
            nova_palavra_passe
        } = req.body;

        if (!palavra_passe_actual || !nova_palavra_passe) {
            return res.status(400).json({
                success: false,
                message: 'A palavra-passe actual e a nova palavra-passe são obrigatórias.'
            });
        }

        if (nova_palavra_passe.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'A nova palavra-passe deve conter pelo menos 6 caracteres.'
            });
        }

        const [utilizadores] = await pool.query(
            `
            SELECT id, palavra_passe
            FROM utilizadores
            WHERE id = ?
            LIMIT 1
            `,
            [utilizadorId]
        );

        if (utilizadores.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Utilizador não encontrado.'
            });
        }

        const palavraPasseValida = await bcrypt.compare(
            palavra_passe_actual,
            utilizadores[0].palavra_passe
        );

        if (!palavraPasseValida) {
            return res.status(400).json({
                success: false,
                message: 'A palavra-passe actual está incorrecta.'
            });
        }

        const novaPalavraPasseHash = await bcrypt.hash(
            nova_palavra_passe,
            12
        );

        await pool.query(
            `
            UPDATE utilizadores
            SET palavra_passe = ?,
                data_actualizacao = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [novaPalavraPasseHash, utilizadorId]
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
 * /api/auth/logout:
 *   post:
 *     summary: Terminar sessão
 *     description: Termina a sessão do utilizador autenticado. Como o sistema utiliza JWT stateless, o token deve ser removido pelo cliente.
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sessão terminada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Sessão terminada com sucesso."
 *       401:
 *         description: Não autenticado ou token inválido
 */
const logout = async (req, res, next) => {
    try {
        return res.status(200).json({
            success: true,
            message: 'Sessão terminada com sucesso.'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
    me,
    changePassword,
    logout
};