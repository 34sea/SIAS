const pool = require('../config/db');

/**
 * @swagger
 * tags:
 *   - name: Estudantes
 *     description: Gestão de estudantes
 */

/**
 * @swagger
 * /api/estudantes:
 *   get:
 *     summary: Listar estudantes
 *     tags: [Estudantes]
 *     security: - bearerAuth: []
 *   post:
 *     summary: Criar estudante
 *     tags: [Estudantes]
 *     security: - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [utilizador_id, curso_id]
 *             properties:
 *               utilizador_id: { type: integer }
 *               curso_id: { type: integer }
 *               numero_estudante: { type: string }
 *               ano_ingresso: { type: integer }
 *               ativo: { type: boolean }
 */
const getEstudantes = async (req, res, next) => {
    try {
        const { search = '', curso_id, ativo } = req.query;
        let sql = `
            SELECT e.id, e.utilizador_id, u.nome_completo, u.email, u.username,
                   e.curso_id, c.nome AS curso_nome, e.numero_estudante,
                   e.ano_ingresso, e.ativo, e.criado_em
            FROM estudantes e
            INNER JOIN utilizadores u ON u.id = e.utilizador_id
            INNER JOIN cursos c ON c.id = e.curso_id
            WHERE 1=1
        `;
        const params = [];
        if (search.trim() !== '') {
            sql += ` AND (u.nome_completo LIKE ? OR u.email LIKE ? OR e.numero_estudante LIKE ?)`;
            const v = `%${search.trim()}%`;
            params.push(v, v, v);
        }
        if (curso_id) {
            sql += ` AND e.curso_id = ?`;
            params.push(curso_id);
        }
        if (ativo !== undefined) {
            sql += ` AND e.ativo = ?`;
            params.push(ativo === '1' || ativo === true ? 1 : 0);
        }
        sql += ` ORDER BY u.nome_completo ASC`;
        const [estudantes] = await pool.query(sql, params);
        return res.status(200).json({ success: true, total: estudantes.length, data: estudantes });
    } catch (error) { next(error); }
};

/**
 * @swagger
 * /api/estudantes/{id}:
 *   get:
 *     summary: Obter estudante por ID
 *     tags: [Estudantes]
 *     security: - bearerAuth: []
 *   put:
 *     summary: Actualizar estudante
 *     tags: [Estudantes]
 *     security: - bearerAuth: []
 *   delete:
 *     summary: Eliminar estudante
 *     tags: [Estudantes]
 *     security: - bearerAuth: []
 */
const getEstudanteById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            `SELECT e.*, u.nome_completo, u.email, u.username, c.nome AS curso_nome
             FROM estudantes e
             INNER JOIN utilizadores u ON u.id = e.utilizador_id
             INNER JOIN cursos c ON c.id = e.curso_id
             WHERE e.id = ? LIMIT 1`,
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Estudante não encontrado.' });
        }
        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) { next(error); }
};

const createEstudante = async (req, res, next) => {
    try {
        const { utilizador_id, curso_id, numero_estudante, ano_ingresso, ativo } = req.body;
        if (!utilizador_id || !curso_id) {
            return res.status(400).json({ success: false, message: 'Utilizador e curso são obrigatórios.' });
        }
        const [utilizador] = await pool.query(`SELECT id, role_id FROM utilizadores WHERE id = ? LIMIT 1`, [utilizador_id]);
        if (utilizador.length === 0) {
            return res.status(400).json({ success: false, message: 'O utilizador indicado não existe.' });
        }
        const [curso] = await pool.query(`SELECT id FROM cursos WHERE id = ? LIMIT 1`, [curso_id]);
        if (curso.length === 0) {
            return res.status(400).json({ success: false, message: 'O curso indicado não existe.' });
        }
        const [existente] = await pool.query(`SELECT id FROM estudantes WHERE utilizador_id = ? LIMIT 1`, [utilizador_id]);
        if (existente.length > 0) {
            return res.status(409).json({ success: false, message: 'Este utilizador já é estudante.' });
        }
        const [resultado] = await pool.query(
            `INSERT INTO estudantes (utilizador_id, curso_id, numero_estudante, ano_ingresso, ativo)
             VALUES (?, ?, ?, ?, ?)`,
            [utilizador_id, curso_id, numero_estudante || null, ano_ingresso || null,
             ativo !== undefined ? (ativo === '1' || ativo === true ? 1 : 0) : 1]
        );
        const [estudante] = await pool.query(
            `SELECT e.*, u.nome_completo, c.nome AS curso_nome FROM estudantes e
             INNER JOIN utilizadores u ON u.id = e.utilizador_id
             INNER JOIN cursos c ON c.id = e.curso_id WHERE e.id = ?`,
            [resultado.insertId]
        );
        return res.status(201).json({ success: true, message: 'Estudante registado com sucesso.', data: estudante[0] });
    } catch (error) { next(error); }
};

const updateEstudante = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { curso_id, numero_estudante, ano_ingresso, ativo } = req.body;
        const [existente] = await pool.query(`SELECT id FROM estudantes WHERE id = ? LIMIT 1`, [id]);
        if (existente.length === 0) {
            return res.status(404).json({ success: false, message: 'Estudante não encontrado.' });
        }
        const campos = [];
        const valores = [];
        if (curso_id !== undefined) { campos.push('curso_id = ?'); valores.push(curso_id); }
        if (numero_estudante !== undefined) { campos.push('numero_estudante = ?'); valores.push(numero_estudante); }
        if (ano_ingresso !== undefined) { campos.push('ano_ingresso = ?'); valores.push(ano_ingresso); }
        if (ativo !== undefined) { campos.push('ativo = ?'); valores.push(ativo === '1' || ativo === true ? 1 : 0); }
        if (campos.length === 0) {
            return res.status(400).json({ success: false, message: 'Nenhum campo enviado para actualização.' });
        }
        valores.push(id);
        await pool.query(`UPDATE estudantes SET ${campos.join(', ')} WHERE id = ?`, valores);
        const [estudante] = await pool.query(
            `SELECT e.*, u.nome_completo, c.nome AS curso_nome FROM estudantes e
             INNER JOIN utilizadores u ON u.id = e.utilizador_id
             INNER JOIN cursos c ON c.id = e.curso_id WHERE e.id = ?`,
            [id]
        );
        return res.status(200).json({ success: true, message: 'Estudante actualizado com sucesso.', data: estudante[0] });
    } catch (error) { next(error); }
};

const deleteEstudante = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [existente] = await pool.query(`SELECT id FROM estudantes WHERE id = ? LIMIT 1`, [id]);
        if (existente.length === 0) {
            return res.status(404).json({ success: false, message: 'Estudante não encontrado.' });
        }
        await pool.query(`DELETE FROM estudantes WHERE id = ?`, [id]);
        return res.status(200).json({ success: true, message: 'Estudante eliminado com sucesso.' });
    } catch (error) { next(error); }
};

module.exports = { getEstudantes, getEstudanteById, createEstudante, updateEstudante, deleteEstudante };
