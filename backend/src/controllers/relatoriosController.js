const pool = require('../config/db');

/**
 * @swagger
 * tags:
 *   - name: Relatorios
 *     description: Gestão e listagem de relatórios de similaridade gerados
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     Relatorio:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         analise_id:
 *           type: integer
 *           example: 1
 *         numero_relatorio:
 *           type: string
 *           example: "REL-2026-001"
 *         caminho_ficheiro:
 *           type: string
 *           example: "uploads/relatorios/relatorio-1.pdf"
 *         formato:
 *           type: string
 *           example: "PDF"
 *         percentual_similaridade:
 *           type: number
 *           format: float
 *           example: 15.4
 *         classificacao:
 *           type: string
 *           example: "BAIXA"
 *         disponivel_estudante:
 *           type: integer
 *           description: "1 para disponível, 0 para indisponível"
 *           example: 1
 *         disponivel_orientador:
 *           type: integer
 *           description: "1 para disponível, 0 para indisponível"
 *           example: 1
 *         data_geracao:
 *           type: string
 *           format: date-time
 *           example: "2026-09-18T08:31:00.000Z"
 *         monografia_titulo:
 *           type: string
 *           example: "Sistema de Gestão Académica"
 *         estudante_nome:
 *           type: string
 *           example: "Martinho Domingos"
 *         similaridade_analise:
 *           type: number
 *           format: float
 *           example: 15.4
 *
 *     RelatoriosResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         total:
 *           type: integer
 *           example: 5
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Relatorio'
 *
 *     RelatorioErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Relatório não encontrado."
 */

/**
 * @swagger
 * /api/relatorios:
 *   get:
 *     summary: Listar relatórios
 *     description: Retorna a lista de relatórios de similaridade gerados, permitindo filtragem opcional por ID de análise e disponibilidade para estudante ou orientador.
 *     tags: [Relatorios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: analise_id
 *         schema:
 *           type: integer
 *         description: Filtra os relatórios associados a um ID de análise específico.
 *         example: 1
 *       - in: query
 *         name: disponivel_estudante
 *         schema:
 *           type: integer
 *         description: Filtra pela disponibilidade do relatório para o estudante (1 = Disponível, 0 = Indisponível).
 *         example: 1
 *       - in: query
 *         name: disponivel_orientador
 *         schema:
 *           type: integer
 *         description: Filtra pela disponibilidade do relatório para o orientador (1 = Disponível, 0 = Indisponível).
 *         example: 1
 *     responses:
 *       200:
 *         description: Lista de relatórios obtida com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RelatoriosResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 */
const getRelatorios = async (req, res, next) => {
    try {
        const { analise_id, disponivel_estudante, disponivel_orientador } = req.query;
        let sql = `
            SELECT r.id, r.analise_id, r.numero_relatorio, r.caminho_ficheiro, r.formato,
                   r.percentual_similaridade, r.classificacao, r.disponivel_estudante,
                   r.disponivel_orientador, r.data_geracao,
                   m.titulo AS monografia_titulo,
                   u.nome_completo AS estudante_nome,
                   a.similaridade_geral AS similaridade_analise
            FROM relatorios r
            INNER JOIN analises a ON a.id = r.analise_id
            INNER JOIN monografia_versoes mv ON mv.id = a.monografia_versao_id
            INNER JOIN monografias m ON m.id = mv.monografia_id
            INNER JOIN estudantes e ON e.id = m.estudante_id
            INNER JOIN utilizadores u ON u.id = e.utilizador_id
            WHERE 1=1
        `;
        const params = [];
        if (analise_id) { sql += ` AND r.analise_id = ?`; params.push(analise_id); }
        if (disponivel_estudante !== undefined) {
            sql += ` AND r.disponivel_estudante = ?`;
            params.push(disponivel_estudante === '1' || disponivel_estudante === true ? 1 : 0);
        }
        if (disponivel_orientador !== undefined) {
            sql += ` AND r.disponivel_orientador = ?`;
            params.push(disponivel_orientador === '1' || disponivel_orientador === true ? 1 : 0);
        }
        sql += ` ORDER BY r.data_geracao DESC`;
        const [relatorios] = await pool.query(sql, params);
        return res.status(200).json({ success: true, total: relatorios.length, data: relatorios });
    } catch (error) { next(error); }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateRelatorioDisponibilidadeRequest:
 *       type: object
 *       properties:
 *         disponivel_estudante:
 *           type: integer
 *           description: "1 para disponível, 0 para indisponível"
 *           example: 1
 *         disponivel_orientador:
 *           type: integer
 *           description: "1 para disponível, 0 para indisponível"
 *           example: 1
 *
 *     RelatorioResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/Relatorio'
 */

/**
 * @swagger
 * /api/relatorios/{id}:
 *   get:
 *     summary: Obter relatório por ID
 *     description: Retorna os detalhes completos de um relatório de similaridade específico através do seu ID.
 *     tags: [Relatorios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do relatório.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Relatório encontrado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RelatorioResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Relatório não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RelatorioErrorResponse'
 * 
 *   patch:
 *     summary: Actualizar disponibilidade do relatório
 *     description: Permite alterar a visibilidade/disponibilidade do relatório de similaridade para o estudante ou para o orientador.
 *     tags: [Relatorios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do relatório.
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRelatorioDisponibilidadeRequest'
 *     responses:
 *       200:
 *         description: Disponibilidade do relatório actualizada com sucesso.
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
 *                   example: "Disponibilidade actualizada com sucesso."
 *       400:
 *         description: Dados inválidos ou nenhum parâmetro de disponibilidade enviado.
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Relatório não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RelatorioErrorResponse'
 */
const getRelatorioById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            `SELECT r.*, m.titulo AS monografia_titulo, u.nome_completo AS estudante_nome
             FROM relatorios r
             INNER JOIN analises a ON a.id = r.analise_id
             INNER JOIN monografia_versoes mv ON mv.id = a.monografia_versao_id
             INNER JOIN monografias m ON m.id = mv.monografia_id
             INNER JOIN estudantes e ON e.id = m.estudante_id
             INNER JOIN utilizadores u ON u.id = e.utilizador_id
             WHERE r.id = ? LIMIT 1`,
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Relatório não encontrado.' });
        }
        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) { next(error); }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateRelatorioRequest:
 *       type: object
 *       required:
 *         - analise_id
 *       properties:
 *         analise_id:
 *           type: integer
 *           example: 1
 *         gerado_por:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         disponivel_estudante:
 *           type: boolean
 *           description: "True/1 para disponibilizar, False/0 para ocultar"
 *           example: true
 *         disponivel_orientador:
 *           type: boolean
 *           description: "True/1 para disponibilizar, False/0 para ocultar"
 *           example: true
 *
 *     RelatorioCreatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Relatório gerado com sucesso."
 *         data:
 *           $ref: '#/components/schemas/Relatorio'
 */

/**
 * @swagger
 * /api/relatorios:
 *   post:
 *     summary: Gerar relatório de similaridade
 *     description: Cria um novo relatório em formato PDF associado a uma análise concluída.
 *     tags: [Relatorios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRelatorioRequest'
 *     responses:
 *       201:
 *         description: Relatório gerado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RelatorioCreatedResponse'
 *       400:
 *         description: A análise é obrigatória ou ainda não foi concluída.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RelatorioErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Análise não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RelatorioErrorResponse'
 *       409:
 *         description: Já existe um relatório para esta análise.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RelatorioErrorResponse'
 */

const gerarRelatorio = async (req, res, next) => {
    try {
        const { analise_id, gerado_por, disponivel_estudante, disponivel_orientador } = req.body;
        if (!analise_id) {
            return res.status(400).json({ success: false, message: 'A análise é obrigatória.' });
        }
        const [analise] = await pool.query(`SELECT id, similaridade_geral, classificacao FROM analises WHERE id = ? LIMIT 1`, [analise_id]);
        if (analise.length === 0) {
            return res.status(404).json({ success: false, message: 'Análise não encontrada.' });
        }
        if (analise[0].estado !== 'CONCLUIDA') {
            return res.status(400).json({ success: false, message: 'A análise ainda não foi concluída.' });
        }
        const [existe] = await pool.query(`SELECT id FROM relatorios WHERE analise_id = ? LIMIT 1`, [analise_id]);
        if (existe.length > 0) {
            return res.status(409).json({ success: false, message: 'Já existe um relatório para esta análise.' });
        }
        const numeroRelatorio = `SIAS-${Date.now()}`;
        const [resultado] = await pool.query(
            `INSERT INTO relatorios (analise_id, numero_relatorio, formato, percentual_similaridade,
                    classificacao, disponivel_estudante, disponivel_orientador, gerado_por)
             VALUES (?, ?, 'PDF', ?, ?, ?, ?, ?)`,
            [
                analise_id, numeroRelatorio,
                analise[0].similaridade_geral,
                analise[0].classificacao,
                disponivel_estudante === '1' || disponivel_estudante === true ? 1 : 0,
                disponivel_orientador !== undefined ? (disponivel_orientador === '1' || disponivel_orientador === true ? 1 : 0) : 1,
                gerado_por || null
            ]
        );
        const [relatorio] = await pool.query(`SELECT * FROM relatorios WHERE id = ?`, [resultado.insertId]);
        return res.status(201).json({ success: true, message: 'Relatório gerado com sucesso.', data: relatorio[0] });
    } catch (error) { next(error); }
};
/**
 * @swagger
 * /api/relatorios/{id}:
 *   patch:
 *     summary: Actualizar disponibilidade do relatório
 *     description: Altera a visibilidade do relatório para estudantes e/ou orientadores.
 *     tags: [Relatorios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do relatório.
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRelatorioDisponibilidadeRequest'
 *     responses:
 *       200:
 *         description: Disponibilidade actualizada com sucesso.
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
 *                   example: "Disponibilidade actualizada com sucesso."
 *       400:
 *         description: Nenhum campo enviado para actualização.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RelatorioErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Relatório não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RelatorioErrorResponse'
 */
const atualizarDisponibilidade = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { disponivel_estudante, disponivel_orientador } = req.body;
        const [existente] = await pool.query(`SELECT id FROM relatorios WHERE id = ? LIMIT 1`, [id]);
        if (existente.length === 0) {
            return res.status(404).json({ success: false, message: 'Relatório não encontrado.' });
        }
        const campos = [];
        const valores = [];
        if (disponivel_estudante !== undefined) {
            campos.push('disponivel_estudante = ?');
            valores.push(disponivel_estudante === '1' || disponivel_estudante === true ? 1 : 0);
        }
        if (disponivel_orientador !== undefined) {
            campos.push('disponivel_orientador = ?');
            valores.push(disponivel_orientador === '1' || disponivel_orientador === true ? 1 : 0);
        }
        if (campos.length === 0) {
            return res.status(400).json({ success: false, message: 'Nenhum campo enviado para actualização.' });
        }
        valores.push(id);
        await pool.query(`UPDATE relatorios SET ${campos.join(', ')} WHERE id = ?`, valores);
        return res.status(200).json({ success: true, message: 'Disponibilidade actualizada com sucesso.' });
    } catch (error) { next(error); }
};

module.exports = { getRelatorios, getRelatorioById, gerarRelatorio, atualizarDisponibilidade };
