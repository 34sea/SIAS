const pool = require('../config/db');

/**
 * @swagger
 * tags:
 *   - name: Notificacoes
 *     description: Gestão das notificações internas do sistema
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     Notificacao:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         utilizador_id:
 *           type: integer
 *           example: 2
 *         tipo:
 *           type: string
 *           example: "SISTEMA"
 *         titulo:
 *           type: string
 *           example: "Nova Análise Concluída"
 *         mensagem:
 *           type: string
 *           example: "A sua monografia foi analisada com sucesso."
 *         referencia_tipo:
 *           type: string
 *           nullable: true
 *           example: "ANALISE"
 *         referencia_id:
 *           type: integer
 *           nullable: true
 *           example: 5
 *         lida:
 *           type: integer
 *           description: "1 para lida, 0 para não lida"
 *           example: 0
 *         data_leitura:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         criado_em:
 *           type: string
 *           format: date-time
 *           example: "2026-10-18T08:30:00.000Z"
 *         nome_completo:
 *           type: string
 *           example: "Martinho Domingos"
 *
 *     CreateNotificacaoRequest:
 *       type: object
 *       required:
 *         - utilizador_id
 *         - tipo
 *         - titulo
 *         - mensagem
 *       properties:
 *         utilizador_id:
 *           type: integer
 *           example: 2
 *         tipo:
 *           type: string
 *           example: "SISTEMA"
 *         titulo:
 *           type: string
 *           example: "Nova Análise Concluída"
 *         mensagem:
 *           type: string
 *           example: "A sua monografia foi analisada com sucesso."
 *         referencia_tipo:
 *           type: string
 *           nullable: true
 *           example: "ANALISE"
 *         referencia_id:
 *           type: integer
 *           nullable: true
 *           example: 5
 *
 *     NotificacoesResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         total:
 *           type: integer
 *           example: 3
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Notificacao'
 *
 *     NotificacaoResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/Notificacao'
 *
 *     NotificacaoCreatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Notificação criada com sucesso."
 *         data:
 *           $ref: '#/components/schemas/Notificacao'
 *
 *     NotificacaoErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Notificação não encontrada."
 */

/**
 * @swagger
 * /api/notificacoes:
 *   get:
 *     summary: Listar notificações
 *     description: Retorna a lista de notificações do sistema, permitindo filtragem opcional por ID do utilizador e estado de leitura.
 *     tags: [Notificacoes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: utilizador_id
 *         schema:
 *           type: integer
 *         description: Filtra as notificações pelo ID do utilizador destinatário.
 *         example: 2
 *       - in: query
 *         name: lida
 *         schema:
 *           type: integer
 *         description: Filtra pelo estado de leitura (1 = Lida, 0 = Não lida).
 *         example: 0
 *     responses:
 *       200:
 *         description: Lista de notificações obtida com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificacoesResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *
 *   post:
 *     summary: Criar notificação
 *     description: Cria e envia uma nova notificação interna para um utilizador específico.
 *     tags: [Notificacoes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNotificacaoRequest'
 *     responses:
 *       201:
 *         description: Notificação criada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificacaoCreatedResponse'
 *       400:
 *         description: Campos obrigatórios em falta (utilizador, tipo, título ou mensagem).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificacaoErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
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
 *     description: Altera o estado de uma notificação específica para lida e regista a data e hora actuais.
 *     tags: [Notificacoes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da notificação.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Notificação marcada como lida com sucesso.
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
 *                   example: "Notificação marcada como lida."
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Notificação não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificacaoErrorResponse'
 *
 * /api/notificacoes/{id}:
 *   delete:
 *     summary: Eliminar notificação
 *     description: Remove permanentemente uma notificação do sistema através do seu ID.
 *     tags: [Notificacoes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da notificação.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Notificação eliminada com sucesso.
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
 *                   example: "Notificação eliminada com sucesso."
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Notificação não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificacaoErrorResponse'
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
