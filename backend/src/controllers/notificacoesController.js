const pool = require('../config/db');

/**
 * @swagger
 * tags:
 *   - name: Notificacoes
 *     description: Notificações internas do sistema
 */

/**
 * @swagger
 * /api/notificacoes:
 *   get:
 *     summary: Listar notificações
 *     tags: [Notificacoes]
 *     security: - bearerAuth: []
 *   post:
 *     summary: Criar notificação
 *     tags: [Notificacoes]
 *     security: - bearerAuth: []
 */
const getNotificacoes = async (req, res, next) => {
    try {
        const { utilizador_id, lida } = req.query;
        let sql = `
            SELECT n.id, n.utilizador_id, n.tipo, n.titulo, n.mensagem,
                   n.referencia_tipo, n.referencia_id, n.lida, n.data_leitura, n.criado_em,
                   u.nome_completo
            FROM notificacoes n
            INNER JOIN utilizadores u ON u.id = n.utilizador_id
            WHERE 1=1
        `;
        const params = [];
        if (utilizador_id) { sql += ` AND n.utilizador_id = ?`; params.push(utilizador_id); }
        if (lida !== undefined) {
            sql += ` AND n.lida = ?`;
            params.push(lida === '1' || lida === true ? 1 : 0);
        }
        sql += ` ORDER BY n.criado_em DESC`;
        const [notificacoes] = await pool.query(sql, params);
        return res.status(200).json({ success: true, total: notificacoes.length, data: notificacoes });
    } catch (error) { next(error); }
};

const criarNotificacao = async (req, res, next) => {
    try {
        const { utilizador_id, tipo, titulo, mensagem, referencia_tipo, referencia_id } = req.body;
        if (!utilizador_id || !tipo || !titulo || !mensagem) {
            return res.status(400).json({ success: false, message: 'Utilizador, tipo, título e mensagem são obrigatórios.' });
        }
        const [resultado] = await pool.query(
            `INSERT INTO notificacoes (utilizador_id, tipo, titulo, mensagem, referencia_tipo, referencia_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [utilizador_id, tipo, titulo, mensagem, referencia_tipo || null, referencia_id || null]
        );
        const [notificacao] = await pool.query(`SELECT * FROM notificacoes WHERE id = ?`, [resultado.insertId]);
        return res.status(201).json({ success: true, message: 'Notificação criada com sucesso.', data: notificacao[0] });
    } catch (error) { next(error); }
};

/**
 * @swagger
 * /api/notificacoes/{id}/lida:
 *   patch:
 *     summary: Marcar notificação como lida
 *     tags: [Notificacoes]
 *     security: - bearerAuth: []
 * /api/notificacoes/{id}:
 *   delete:
 *     summary: Eliminar notificação
 *     tags: [Notificacoes]
 *     security: - bearerAuth: []
 */
const marcarComoLida = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [existente] = await pool.query(`SELECT id FROM notificacoes WHERE id = ? LIMIT 1`, [id]);
        if (existente.length === 0) {
            return res.status(404).json({ success: false, message: 'Notificação não encontrada.' });
        }
        await pool.query(
            `UPDATE notificacoes SET lida = TRUE, data_leitura = NOW() WHERE id = ?`,
            [id]
        );
        return res.status(200).json({ success: true, message: 'Notificação marcada como lida.' });
    } catch (error) { next(error); }
};

const eliminarNotificacao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [existente] = await pool.query(`SELECT id FROM notificacoes WHERE id = ? LIMIT 1`, [id]);
        if (existente.length === 0) {
            return res.status(404).json({ success: false, message: 'Notificação não encontrada.' });
        }
        await pool.query(`DELETE FROM notificacoes WHERE id = ?`, [id]);
        return res.status(200).json({ success: true, message: 'Notificação eliminada com sucesso.' });
    } catch (error) { next(error); }
};

module.exports = { getNotificacoes, criarNotificacao, marcarComoLida, eliminarNotificacao };
