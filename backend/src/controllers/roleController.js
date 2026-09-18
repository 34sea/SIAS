const pool = require('../config/db');

/**
 * Listar todos os perfis
 */
const getRoles = async (req, res, next) => {
    try {
        const [roles] = await pool.query(
            `
            SELECT
                id,
                nome,
                descricao,
                estado,
                data_criacao,
                data_actualizacao
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
const getRoleById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [roles] = await pool.query(
            `
            SELECT
                id,
                nome,
                descricao,
                estado,
                data_criacao,
                data_actualizacao
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
                descricao,
                estado
            )
            VALUES (?, ?, 'ACTIVO')
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
                estado,
                data_criacao
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
const updateRole = async (req, res, next) => {
    try {
        const { id } = req.params;

        const {
            nome,
            descricao,
            estado
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

        if (estado !== undefined) {
            if (!['ACTIVO', 'INACTIVO'].includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado inválido.'
                });
            }

            campos.push('estado = ?');
            valores.push(estado);
        }

        if (campos.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum campo foi enviado para actualização.'
            });
        }

        campos.push(
            'data_actualizacao = CURRENT_TIMESTAMP'
        );

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
                estado,
                data_criacao,
                data_actualizacao
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
 * Activar/desactivar perfil
 */
const updateRoleStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!['ACTIVO', 'INACTIVO'].includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'O estado deve ser ACTIVO ou INACTIVO.'
            });
        }

        const [role] = await pool.query(
            `
            SELECT id
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

        await pool.query(
            `
            UPDATE roles
            SET estado = ?,
                data_actualizacao = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [estado, id]
        );

        return res.status(200).json({
            success: true,
            message: `Perfil ${estado === 'ACTIVO' ? 'activado' : 'desactivado'} com sucesso.`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Listar permissões de um perfil
 */
const getRolePermissions = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [role] = await pool.query(
            `
            SELECT id, nome, descricao, estado
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
                p.codigo,
                p.nome,
                p.descricao,
                p.modulo,
                p.estado
            FROM permissoes p
            INNER JOIN role_permissoes rp
                ON rp.permissao_id = p.id
            WHERE rp.role_id = ?
            ORDER BY p.modulo ASC, p.nome ASC
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
                  AND estado = 'ACTIVO'
                `,
                permissao_ids
            );

            if (permissoes.length !== permissao_ids.length) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: 'Uma ou mais permissões não existem ou estão inactivas.'
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

module.exports = {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    updateRoleStatus,
    getRolePermissions,
    assignRolePermissions
};