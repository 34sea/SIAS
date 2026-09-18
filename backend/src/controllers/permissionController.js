const pool = require('../config/db');

/**
 * Listar permissões
 */
const getPermissions = async (req, res, next) => {
    try {
        const {
            search = '',
            estado
        } = req.query;

        let sql = `
            SELECT
                id,
                codigo,
                nome,
                descricao,
                modulo,
                estado,
                data_criacao,
                data_actualizacao
            FROM permissoes
            WHERE 1 = 1
        `;

        const params = [];

        if (search.trim() !== '') {
            sql += `
                AND (
                    codigo LIKE ?
                    OR nome LIKE ?
                    OR modulo LIKE ?
                )
            `;

            const value = `%${search.trim()}%`;

            params.push(
                value,
                value,
                value
            );
        }

        if (estado) {
            sql += ` AND estado = ? `;
            params.push(estado);
        }

        sql += ` ORDER BY modulo ASC, nome ASC `;

        const [permissoes] = await pool.query(
            sql,
            params
        );

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
const getPermissionById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [permissoes] = await pool.query(
            `
            SELECT
                id,
                codigo,
                nome,
                descricao,
                modulo,
                estado,
                data_criacao,
                data_actualizacao
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
const createPermission = async (req, res, next) => {
    try {
        const {
            codigo,
            nome,
            descricao,
            modulo
        } = req.body;

        if (!codigo || !nome) {
            return res.status(400).json({
                success: false,
                message: 'O código e o nome da permissão são obrigatórios.'
            });
        }

        const [existente] = await pool.query(
            `
            SELECT id
            FROM permissoes
            WHERE codigo = ?
            LIMIT 1
            `,
            [codigo]
        );

        if (existente.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Já existe uma permissão com este código.'
            });
        }

        const [resultado] = await pool.query(
            `
            INSERT INTO permissoes (
                codigo,
                nome,
                descricao,
                modulo,
                estado
            )
            VALUES (?, ?, ?, ?, 'ACTIVO')
            `,
            [
                codigo,
                nome,
                descricao || null,
                modulo || null
            ]
        );

        const [permissao] = await pool.query(
            `
            SELECT
                id,
                codigo,
                nome,
                descricao,
                modulo,
                estado,
                data_criacao
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
const updatePermission = async (req, res, next) => {
    try {
        const { id } = req.params;

        const {
            codigo,
            nome,
            descricao,
            modulo,
            estado
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

        if (codigo !== undefined) {
            campos.push('codigo = ?');
            valores.push(codigo);
        }

        if (nome !== undefined) {
            campos.push('nome = ?');
            valores.push(nome);
        }

        if (descricao !== undefined) {
            campos.push('descricao = ?');
            valores.push(descricao);
        }

        if (modulo !== undefined) {
            campos.push('modulo = ?');
            valores.push(modulo);
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
                codigo,
                nome,
                descricao,
                modulo,
                estado,
                data_criacao,
                data_actualizacao
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

module.exports = {
    getPermissions,
    getPermissionById,
    createPermission,
    updatePermission
};