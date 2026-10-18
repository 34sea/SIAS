const pool = require('../config/db');

/**
 * @swagger
 * tags:
 *   - name: Auditoria
 *     description: Registo de operações importantes (audit log)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AuditoriaLog:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         utilizador_id:
 *           type: integer
 *           nullable: true
 *           example: 2
 *         nome_completo:
 *           type: string
 *           nullable: true
 *           example: "Administrador do Sistema"
 *         acao:
 *           type: string
 *           description: "Ação realizada (ex. CREATE, UPDATE, DELETE, LOGIN)"
 *           example: "CREATE"
 *         entidade:
 *           type: string
 *           description: "Entidade ou tabela afetada"
 *           example: "monografias"
 *         entidade_id:
 *           type: integer
 *           nullable: true
 *           example: 15
 *         descricao:
 *           type: string
 *           nullable: true
 *           description: "Descrição detalhada da operação"
 *           example: "Submissão de nova monografia por parte do estudante."
 *         ip_address:
 *           type: string
 *           nullable: true
 *           example: "192.168.1.50"
 *         criado_em:
 *           type: string
 *           format: date-time
 *           example: "2026-03-01T10:15:30.000Z"
 *
 *     AuditoriaResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         total:
 *           type: integer
 *           example: 25
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AuditoriaLog'
 *
 *     AuditoriaErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Erro ao obter registos de auditoria."
 */

/**
 * @swagger
 * /api/auditoria:
 *   get:
 *     summary: Listar auditoria
 *     description: Retorna o histórico de registos de auditoria do sistema (audit log), permitindo filtros opcionais por texto livre, utilizador, tipo de ação ou entidade afetada, ordenados do mais recente para o mais antigo.
 *     tags: [Auditoria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Pesquisa textual por ação, entidade ou descrição.
 *         example: "CREATE"
 *       - in: query
 *         name: utilizador_id
 *         schema:
 *           type: integer
 *         description: Filtra os registos gerados por um utilizador específico.
 *         example: 2
 *       - in: query
 *         name: acao
 *         schema:
 *           type: string
 *         description: Filtra estritamente pelo tipo de ação (ex. LOGIN, CREATE, UPDATE, DELETE).
 *         example: "UPDATE"
 *       - in: query
 *         name: entidade
 *         schema:
 *           type: string
 *         description: Filtra estritamente pela entidade/tabela afetada (ex. monografias, utilizadores, cursos).
 *         example: "cursos"
 *     responses:
 *       200:
 *         description: Lista de registos de auditoria obtida com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuditoriaResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       500:
 *         description: Erro interno no servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuditoriaErrorResponse'
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
