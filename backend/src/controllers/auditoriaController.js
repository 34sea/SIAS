const pool = require('../config/db');

/**
 * @swagger
 * tags:
 *   - name: Auditoria
 *     description: Registo de operações importantes (audit log)
 */

/**
 * @swagger
 * /api/auditoria:
 *   get:
 *     summary: Listar auditoria
 *     tags: [Auditoria]
 *     security: - bearerAuth: []
 */
const getAuditoria = async (req, res, next) => {
    try {
        const { search = '', utilizador_id, acao, entidade } = req.query;
        let sql = `
            SELECT a.id, a.utilizador_id, u.nome_completo, a.acao, a.entidade,
                   a.entidade_id, a.descricao, a.ip_address, a.criado_em
            FROM auditoria a
            LEFT JOIN utilizadores u ON u.id = a.utilizador_id
            WHERE 1=1
        `;
        const params = [];
        if (search.trim() !== '') {
            sql += ` AND (a.acao LIKE ? OR a.entidade LIKE ? OR a.descricao LIKE ?)`;
            const v = `%${search.trim()}%`;
            params.push(v, v, v);
        }
        if (utilizador_id) { sql += ` AND a.utilizador_id = ?`; params.push(utilizador_id); }
        if (acao) { sql += ` AND a.acao = ?`; params.push(acao); }
        if (entidade) { sql += ` AND a.entidade = ?`; params.push(entidade); }
        sql += ` ORDER BY a.criado_em DESC`;
        const [auditoria] = await pool.query(sql, params);
        return res.status(200).json({ success: true, total: auditoria.length, data: auditoria });
    } catch (error) { next(error); }
};

module.exports = { getAuditoria };
