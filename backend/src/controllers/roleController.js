const pool = require('../config/db');

/**
 * Listar todos os perfis
 */
/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Listar todos os perfis
 *     description: Lista os perfis registados no sistema.
 *     tags: [Perfis]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de perfis obtida com sucesso.
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
 *                         example: ADMIN
 *                       descricao:
 *                         type: string
 *                         nullable: true
 *                         example: Administrador do sistema
 *                       criado_em:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Não autenticado ou token inválido.
 */
const getRoles = async (req, res, next) => {
    try {
        const [roles] = await pool.query(
            `
            SELECT
                id,
                nome,
                descricao,
                criado_em
            FROM roles
            ORDER BY nome ASC
            `
        );

        return res.status(200).json({
            success: true,
            total: roles.length,
            data: roles
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Obter perfil por ID
 */
/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Obter perfil por ID
 *     description: Obtém os detalhes de um perfil específico.
 *     tags: [Perfis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do perfil.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Perfil encontrado com sucesso.
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
 *                       example: ADMIN
 *                     descricao:
 *                       type: string
 *                       nullable: true
 *                       example: Administrador do sistema
 *                     criado_em:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Perfil não encontrado.
 */
const getRoleById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [roles] = await pool.query(
            `
            SELECT
                id,
                nome,
                descricao,
                criado_em
            FROM roles
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (roles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Perfil não encontrado.'
            });
        }

        return res.status(200).json({
            success: true,
            data: roles[0]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Criar perfil
 */
/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Criar perfil
 *     description: Regista um novo perfil no sistema. O nome é obrigatório.
 *     tags: [Perfis]
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
 *                 description: Nome único do perfil.
 *                 example: GESTOR
 *               descricao:
 *                 type: string
 *                 nullable: true
 *                 description: Descrição do perfil.
 *                 example: Gestor de operações
 *     responses:
 *       201:
 *         description: Perfil criado com sucesso.
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
 *                   example: Perfil criado com sucesso.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nome:
 *                       type: string
 *                       example: GESTOR
 *                     descricao:
 *                       type: string
 *                       nullable: true
 *                       example: Gestor de operações
 *                     criado_em:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: O nome do perfil é obrigatório.
 *       401:
 *         description: Não autenticado ou token inválido.
 *       409:
 *         description: Já existe um perfil com este nome.
 */
const createRole = async (req, res, next) => {
    try {
        const {
            nome,
            descricao
        } = req.body;

        if (!nome) {
            return res.status(400).json({
                success: false,
                message: 'O nome do perfil é obrigatório.'
            });
        }

        const [existente] = await pool.query(
            `
            SELECT id
            FROM roles
            WHERE nome = ?
            LIMIT 1
            `,
            [nome]
        );

        if (existente.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Já existe um perfil com este nome.'
            });
        }

        const [resultado] = await pool.query(
            `
            INSERT INTO roles (
                nome,
                descricao
            )
            VALUES (?, ?)
            `,
            [
                nome,
                descricao || null
            ]
        );

        const [role] = await pool.query(
            `
            SELECT
                id,
                nome,
                descricao,
                criado_em
            FROM roles
            WHERE id = ?
            `,
            [resultado.insertId]
        );

        return res.status(201).json({
            success: true,
            message: 'Perfil criado com sucesso.',
            data: role[0]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Actualizar perfil
 */
/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Actualizar perfil
 *     description: Actualiza os dados de um perfil existente. Apenas os campos enviados serão alterados.
 *     tags: [Perfis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do perfil a actualizar.
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
 *                 example: GESTOR_SENIOR
 *               descricao:
 *                 type: string
 *                 nullable: true
 *                 example: Gestor sénior de operações
 *     responses:
 *       200:
 *         description: Perfil actualizado com sucesso.
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
 *                   example: Perfil actualizado com sucesso.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nome:
 *                       type: string
 *                       example: GESTOR_SENIOR
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
 *         description: Perfil não encontrado.
 */
const updateRole = async (req, res, next) => {
    try {
        const { id } = req.params;

        const {
            nome,
            descricao
        } = req.body;

        const [existente] = await pool.query(
            `
            SELECT id
            FROM roles
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (existente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Perfil não encontrado.'
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
            UPDATE roles
            SET ${campos.join(', ')}
            WHERE id = ?
            `,
            valores
        );

        const [role] = await pool.query(
            `
            SELECT
                id,
                nome,
                descricao,
                criado_em
            FROM roles
            WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: 'Perfil actualizado com sucesso.',
            data: role[0]
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Eliminar perfil
 */
/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Eliminar perfil
 *     description: Elimina um perfil existente pelo seu ID.
 *     tags: [Perfis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do perfil a eliminar.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Perfil eliminado com sucesso.
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Perfil não encontrado.
 *       500:
 *         description: Erro interno do servidor.
 */
const deleteRole = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [existente] = await pool.query(
            `
            SELECT id
            FROM roles
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (existente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Perfil não encontrado.'
            });
        }

        await pool.query(
            `
            DELETE FROM roles
            WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: 'Perfil eliminado com sucesso.'
        });
    } catch (error) {
        next(error);
    }
};
/**
 * Listar permissões de um perfil
 */
/**
 * @swagger
 * /api/roles/{id}/permissoes:
 *   get:
 *     summary: Listar permissões de um perfil
 *     description: Lista todas as permissões associadas a um perfil específico.
 *     tags: [Perfis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do perfil.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Lista de permissões do perfil obtida com sucesso.
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
 *                     role:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         nome:
 *                           type: string
 *                           example: ADMIN
 *                         descricao:
 *                           type: string
 *                           nullable: true
 *                           example: Administrador do sistema
 *                     permissoes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           nome:
 *                             type: string
 *                             example: UTILIZADORES_VISUALIZAR
 *                           descricao:
 *                             type: string
 *                             nullable: true
 *                             example: Visualizar utilizadores
 *                           criado_em:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Perfil não encontrado.
 */
const getRolePermissions = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [role] = await pool.query(
            `
            SELECT id, nome, descricao
            FROM roles
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (role.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Perfil não encontrado.'
            });
        }

        const [permissoes] = await pool.query(
            `
            SELECT
                p.id,
                p.nome,
                p.descricao,
                p.criado_em
            FROM permissoes p
            INNER JOIN role_permissoes rp
                ON rp.permissao_id = p.id
            WHERE rp.role_id = ?
            ORDER BY p.nome ASC
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            data: {
                role: role[0],
                permissoes
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Associar permissões a um perfil
 */
/**
 * @swagger
 * /api/roles/{id}/permissoes:
 *   put:
 *     summary: Associar permissões a um perfil
 *     description: Substitui ou define a lista de permissões associadas a um perfil específico.
 *     tags: [Perfis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do perfil.
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissao_ids
 *             properties:
 *               permissao_ids:
 *                 type: array
 *                 description: Lista de IDs das permissões a associar.
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Permissões do perfil actualizadas com sucesso.
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
 *                   example: Permissões do perfil actualizadas com sucesso.
 *       400:
 *         description: Formato inválido ou IDs de permissões inexistentes.
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Perfil não encontrado.
 */
const assignRolePermissions = async (req, res, next) => {
    const connection = await pool.getConnection();

    try {
        const { id } = req.params;
        const { permissao_ids } = req.body;

        if (!Array.isArray(permissao_ids)) {
            return res.status(400).json({
                success: false,
                message: 'permissao_ids deve ser um array.'
            });
        }

        await connection.beginTransaction();

        const [role] = await connection.query(
            `
            SELECT id
            FROM roles
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (role.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'Perfil não encontrado.'
            });
        }

        if (permissao_ids.length > 0) {
            const placeholders = permissao_ids
                .map(() => '?')
                .join(',');

            const [permissoes] = await connection.query(
                `
                SELECT id
                FROM permissoes
                WHERE id IN (${placeholders})
                `,
                permissao_ids
            );

            if (permissoes.length !== permissao_ids.length) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: 'Uma ou mais permissões não existem.'
                });
            }
        }

        await connection.query(
            `
            DELETE FROM role_permissoes
            WHERE role_id = ?
            `,
            [id]
        );

        if (permissao_ids.length > 0) {
            const values = permissao_ids.map(
                permissaoId => [id, permissaoId]
            );

            await connection.query(
                `
                INSERT INTO role_permissoes (
                    role_id,
                    permissao_id
                )
                VALUES ?
                `,
                [values]
            );
        }

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: 'Permissões do perfil actualizadas com sucesso.'
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Adicionar uma permissão específica a um perfil
 */
/**
 * @swagger
 * /api/roles/{id}/permissoes:
 *   post:
 *     summary: Adicionar permissão a um perfil
 *     description: Adiciona uma nova permissão a um perfil específico sem remover as existentes.
 *     tags: [Perfis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do perfil.
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissao_id
 *             properties:
 *               permissao_id:
 *                 type: integer
 *                 description: ID da permissão a adicionar.
 *                 example: 5
 *     responses:
 *       200:
 *         description: Permissão adicionada ao perfil com sucesso.
 *       400:
 *         description: ID da permissão em falta ou inválido.
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Perfil ou permissão não encontrados.
 *       409:
 *         description: O perfil já possui esta permissão.
 */
const addPermissionToRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { permissao_id } = req.body;

        if (!permissao_id) {
            return res.status(400).json({
                success: false,
                message: 'O ID da permissão é obrigatório.'
            });
        }

        // Verificar se o perfil existe
        const [role] = await pool.query('SELECT id FROM roles WHERE id = ? LIMIT 1', [id]);
        if (role.length === 0) {
            return res.status(404).json({ success: false, message: 'Perfil não encontrado.' });
        }

        // Verificar se a permissão existe
        const [permissao] = await pool.query('SELECT id FROM permissoes WHERE id = ? LIMIT 1', [permissao_id]);
        if (permissao.length === 0) {
            return res.status(404).json({ success: false, message: 'Permissão não encontrada.' });
        }

        // Inserir (utiliza INSERT IGNORE ou validação prévia para evitar duplicados)
        const [result] = await pool.query(
            `INSERT IGNORE INTO role_permissoes (role_id, permissao_id) VALUES (?, ?)`,
            [id, permissao_id]
        );

        if (result.affectedRows === 0) {
            return res.status(409).json({
                success: false,
                message: 'O perfil já possui esta permissão.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Permissão adicionada ao perfil com sucesso.'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Remover uma permissão específica de um perfil
 */
/**
 * @swagger
 * /api/roles/{id}/permissoes/{permissaoId}:
 *   delete:
 *     summary: Remover permissão de um perfil
 *     description: Remove a associação de uma permissão específica de um perfil.
 *     tags: [Perfis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do perfil.
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: permissaoId
 *         required: true
 *         description: ID da permissão a remover.
 *         schema:
 *           type: integer
 *         example: 5
 *     responses:
 *       200:
 *         description: Permissão removida do perfil com sucesso.
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Associação não encontrada.
 */
const removePermissionFromRole = async (req, res, next) => {
    try {
        const { id, permissaoId } = req.params;

        const [result] = await pool.query(
            `DELETE FROM role_permissoes WHERE role_id = ? AND permissao_id = ?`,
            [id, permissaoId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Associação de permissão não encontrada para este perfil.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Permissão removida do perfil com sucesso.'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    getRolePermissions,
    assignRolePermissions,
    removePermissionFromRole,
    addPermissionToRole
};