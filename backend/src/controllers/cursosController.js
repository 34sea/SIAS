const pool = require('../config/db');

/**
 * @swagger
 * tags:
 *   - name: Cursos
 *     description: Gestão dos cursos da instituição
 */

/**
 * @swagger
 * /api/cursos:
 *   get:
 *     summary: Listar cursos
 *     tags: [Cursos]
 *     security: - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: ativo
 *         schema: { type: string, enum: [ACTIVO, INACTIVO] }
 *     responses:
 *       200: { description: Lista de cursos obtida com sucesso. }
 *   post:
 *     summary: Criar curso
 *     tags: [Cursos]
 *     security: - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, codigo]
 *             properties:
 *               nome: { type: string, example: "Engenharia Informática" }
 *               codigo: { type: string, example: "ENG-INF" }
 *               descricao: { type: string, example: "Curso de engenharia" }
 *               ativo: { type: boolean, example: true }
 *     responses:
 *       201: { description: Curso criado com sucesso. }
 */
const getCursos = async (req, res, next) => {
    try {
        const { search = '', ativo } = req.query;
        let sql = `SELECT id, nome, codigo, descricao, ativo, criado_em, atualizado_em FROM cursos WHERE 1=1`;
        const params = [];
        if (search.trim() !== '') {
            sql += ` AND (nome LIKE ? OR codigo LIKE ?)`;
            const v = `%${search.trim()}%`;
            params.push(v, v);
        }
        if (ativo !== undefined) {
            sql += ` AND ativo = ?`;
            params.push(ativo === '1' || ativo === true ? 1 : 0);
        }
        sql += ` ORDER BY nome ASC`;
        const [cursos] = await pool.query(sql, params);
        return res.status(200).json({ success: true, total: cursos.length, data: cursos });
    } catch (error) { next(error); }
};

/**
 * @swagger
 * /api/cursos/{id}:
 *   get:
 *     summary: Obter curso por ID
 *     tags: [Cursos]
 *     security: - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Curso encontrado. }
 *       404: { description: Curso não encontrado. }
 *   put:
 *     summary: Actualizar curso
 *     tags: [Cursos]
 *     security: - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome: { type: string }
 *               codigo: { type: string }
 *               descricao: { type: string }
 *               ativo: { type: boolean }
 *     responses:
 *       200: { description: Curso actualizado com sucesso. }
 *   delete:
 *     summary: Eliminar curso
 *     tags: [Cursos]
 *     security: - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Curso eliminado com sucesso. }
 */
const getCursoById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`SELECT * FROM cursos WHERE id = ? LIMIT 1`, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Curso não encontrado.' });
        }
        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) { next(error); }
};

const createCurso = async (req, res, next) => {
    try {
        const { nome, codigo, descricao, ativo } = req.body;
        if (!nome || !codigo) {
            return res.status(400).json({ success: false, message: 'Nome e código são obrigatórios.' });
        }
        const [existente] = await pool.query(`SELECT id FROM cursos WHERE codigo = ? OR nome = ? LIMIT 1`, [codigo, nome]);
        if (existente.length > 0) {
            return res.status(409).json({ success: false, message: 'Já existe um curso com este código ou nome.' });
        }
        const [resultado] = await pool.query(
            `INSERT INTO cursos (nome, codigo, descricao, ativo) VALUES (?, ?, ?, ?)`,
            [nome, codigo, descricao || null, ativo !== undefined ? (ativo === '1' || ativo === true ? 1 : 0) : 1]
        );
        const [curso] = await pool.query(`SELECT * FROM cursos WHERE id = ?`, [resultado.insertId]);
        return res.status(201).json({ success: true, message: 'Curso criado com sucesso.', data: curso[0] });
    } catch (error) { next(error); }
};

const updateCurso = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nome, codigo, descricao, ativo } = req.body;
        const [existente] = await pool.query(`SELECT id FROM cursos WHERE id = ? LIMIT 1`, [id]);
        if (existente.length === 0) {
            return res.status(404).json({ success: false, message: 'Curso não encontrado.' });
        }
        const campos = [];
        const valores = [];
        if (nome !== undefined) { campos.push('nome = ?'); valores.push(nome); }
        if (codigo !== undefined) { campos.push('codigo = ?'); valores.push(codigo); }
        if (descricao !== undefined) { campos.push('descricao = ?'); valores.push(descricao); }
        if (ativo !== undefined) { campos.push('ativo = ?'); valores.push(ativo === '1' || ativo === true ? 1 : 0); }
        if (campos.length === 0) {
            return res.status(400).json({ success: false, message: 'Nenhum campo enviado para actualização.' });
        }
        valores.push(id);
        await pool.query(`UPDATE cursos SET ${campos.join(', ')} WHERE id = ?`, valores);
        const [curso] = await pool.query(`SELECT * FROM cursos WHERE id = ?`, [id]);
        return res.status(200).json({ success: true, message: 'Curso actualizado com sucesso.', data: curso[0] });
    } catch (error) { next(error); }
};

const deleteCurso = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [existente] = await pool.query(`SELECT id FROM cursos WHERE id = ? LIMIT 1`, [id]);
        if (existente.length === 0) {
            return res.status(404).json({ success: false, message: 'Curso não encontrado.' });
        }
        await pool.query(`DELETE FROM cursos WHERE id = ?`, [id]);
        return res.status(200).json({ success: true, message: 'Curso eliminado com sucesso.' });
    } catch (error) { next(error); }
};

module.exports = { getCursos, getCursoById, createCurso, updateCurso, deleteCurso };
