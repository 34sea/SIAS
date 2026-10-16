const pool = require('../config/db');

/**
 * @swagger
 * tags:
 *   - name: Relatorios
 *     description: Relatórios de similaridade gerados
 */

/**
 * @swagger
 * /api/relatorios:
 *   get:
 *     summary: Listar relatórios
 *     tags: [Relatorios]
 *     security: - bearerAuth: []
 *   post:
 *     summary: Gerar relatório
 *     tags: [Relatorios]
 *     security: - bearerAuth: []
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
 * /api/relatorios/{id}:
 *   get:
 *     summary: Obter relatório por ID
 *     tags: [Relatorios]
 *     security: - bearerAuth: []
 *   patch:
 *     summary: Actualizar disponibilidade do relatório
 *     tags: [Relatorios]
 *     security: - bearerAuth: []
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
