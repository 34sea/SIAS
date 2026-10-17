const pool = require('../config/db');

/**
 * Listar permissões
 */
/**
 * @swagger
 * /api/permissoes:
 *   get:
 *     summary: Listar permissões
 *     description: Lista as permissões registadas, permitindo filtrar por nome ou descrição.
 *     tags: [Permissões]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         required: false
 *         description: Pesquisa por nome ou descrição.
 *         schema:
 *           type: string
 *         example: UTILIZADORES
 *     responses:
 *       200:
 *         description: Lista de permissões obtida com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       nome:
 *                         type: string
 *                         example: UTILIZADORES_VISUALIZAR
 *                       descricao:
 *                         type: string
 *                         nullable: true
 *                         example: Visualizar utilizadores
 *                       criado_em:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Não autenticado ou token inválido.
 */
const getPermissions = async (req, res, next) => {
    try {
        const { search = '' } = req.query;

        let sql = `
            SELECT
                id,
                nome,
                descricao,
                criado_em
            FROM permissoes
            WHERE 1 = 1
        `;

        const params = [];

        if (search.trim() !== '') {
            sql += `
                AND (
                    nome LIKE ? OR
                    descricao LIKE ?
                )
            `;

            const value = `%${search.trim()}%`;
            params.push(value, value);
        }

        sql += ` ORDER BY nome ASC `;

        const [permissoes] = await pool.query(sql, params);

        return res.status(200).json({
            success: true,
            total: permissoes.length,
            data: permissoes
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Obter permissão por ID
 */
/**
 * @swagger
 * /api/permissoes/{id}:
 *   get:
 *     summary: Obter permissão por ID
 *     description: Obtém os detalhes de uma permissão específica.
 *     tags: [Permissões]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da permissão.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Permissão encontrada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nome:
 *                       type: string
 *                       example: UTILIZADORES_VISUALIZAR
 *                     descricao:
 *                       type: string
 *                       nullable: true
 *                       example: Visualizar utilizadores
 *                     criado_em:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Permissão não encontrada.
 */
const getPermissionById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [permissoes] = await pool.query(
            `
            SELECT
                id,
                nome,
                descricao,
                criado_em
            FROM permissoes
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (permissoes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Permissão não encontrada.'
            });
        }

        return res.status(200).json({
            success: true,
            data: permissoes[0]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Criar permissão
 */
/**
 * @swagger
 * /api/permissoes:
 *   post:
 *     summary: Criar permissão
 *     description: Regista uma nova permissão no sistema. O nome é obrigatório.
 *     tags: [Permissões]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome/Código único da permissão.
 *                 example: UTILIZADORES_EXPORTAR
 *               descricao:
 *                 type: string
 *                 nullable: true
 *                 description: Descrição da permissão.
 *                 example: Permite exportar os utilizadores.
 *     responses:
 *       201:
 *         description: Permissão criada com sucesso.
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
 *                   example: Permissão criada com sucesso.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nome:
 *                       type: string
 *                       example: UTILIZADORES_EXPORTAR
 *                     descricao:
 *                       type: string
 *                       nullable: true
 *                       example: Permite exportar os utilizadores.
 *                     criado_em:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: O nome da permissão é obrigatório.
 *       401:
 *         description: Não autenticado ou token inválido.
 *       409:
 *         description: Já existe uma permissão com este nome.
 */
const createPermission = async (req, res, next) => {
    try {
        const {
            nome,
            descricao
        } = req.body;

        if (!nome) {
            return res.status(400).json({
                success: false,
                message: 'O nome da permissão é obrigatório.'
            });
        }

        const [existente] = await pool.query(
            `
            SELECT id
            FROM permissoes
            WHERE nome = ?
            LIMIT 1
            `,
            [nome]
        );

        if (existente.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Já existe uma permissão com este nome.'
            });
        }

        const [resultado] = await pool.query(
            `
            INSERT INTO permissoes (
                nome,
                codigo,
                descricao
            )
            VALUES (?, ?, ?)
            `,
            [
                nome,
                nome,
                descricao || null
            ]
        );

        const [permissao] = await pool.query(
            `
            SELECT
                id,
                nome,
                descricao,
                criado_em
            FROM permissoes
            WHERE id = ?
            `,
            [resultado.insertId]
        );

        return res.status(201).json({
            success: true,
            message: 'Permissão criada com sucesso.',
            data: permissao[0]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Actualizar permissão
 */
/**
 * @swagger
 * /api/permissoes/{id}:
 *   put:
 *     summary: Actualizar permissão
 *     description: Actualiza os dados de uma permissão existente. Apenas os campos enviados serão alterados.
 *     tags: [Permissões]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da permissão a actualizar.
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 example: UTILIZADORES_VISUALIZAR
 *               descricao:
 *                 type: string
 *                 nullable: true
 *                 example: Visualizar utilizadores registados.
 *     responses:
 *       200:
 *         description: Permissão actualizada com sucesso.
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
 *                   example: Permissão actualizada com sucesso.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nome:
 *                       type: string
 *                       example: UTILIZADORES_VISUALIZAR
 *                     descricao:
 *                       type: string
 *                       nullable: true
 *                     criado_em:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Nenhum campo enviado para actualização.
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Permissão não encontrada.
 */
const updatePermission = async (req, res, next) => {
    try {
        const { id } = req.params;

        const {
            nome,
            descricao
        } = req.body;

        const [existente] = await pool.query(
            `
            SELECT id
            FROM permissoes
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (existente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Permissão não encontrada.'
            });
        }

        const campos = [];
        const valores = [];

        if (nome !== undefined) {
            campos.push('nome = ?');
            valores.push(nome);
        }

        if (descricao !== undefined) {
            campos.push('descricao = ?');
            valores.push(descricao);
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
            UPDATE permissoes
            SET ${campos.join(', ')}
            WHERE id = ?
            `,
            valores
        );

        const [permissao] = await pool.query(
            `
            SELECT
                id,
                nome,
                descricao,
                criado_em
            FROM permissoes
            WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: 'Permissão actualizada com sucesso.',
            data: permissao[0]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Eliminar permissão
 */
/**
 * @swagger
 * /api/permissoes/{id}:
 *   delete:
 *     summary: Eliminar permissão
 *     description: Elimina uma permissão existente pelo seu ID.
 *     tags: [Permissões]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da permissão a eliminar.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Permissão eliminada com sucesso.
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Permissão não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
const deletePermission = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [existente] = await pool.query(
            `
            SELECT id
            FROM permissoes
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (existente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Permissão não encontrada.'
            });
        }

        await pool.query(
            `
            DELETE FROM permissoes
            WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: 'Permissão eliminada com sucesso.'
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPermissions,
    getPermissionById,
    createPermission,
    updatePermission,
    deletePermission
};