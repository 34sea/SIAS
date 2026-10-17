const pool = require('../config/db');

/**
 * @swagger
 * tags:
 *   - name: Cursos
 *     description: Gestão dos cursos da instituição
 */

const getCursos = async (req, res, next) => {
    try {
        const { search = '', ativo } = req.query;
        let sql = `
            SELECT c.id, c.nome, c.codigo, c.descricao, c.ativo, c.criado_em, c.atualizado_em,
                   COUNT(e.id) AS total_estudantes
            FROM cursos c
            LEFT JOIN estudantes e ON e.curso_id = c.id
            WHERE 1=1
        `;
        const params = [];
        if (search.trim() !== '') {
            sql += ` AND (c.nome LIKE ? OR c.codigo LIKE ? OR c.descricao LIKE ?)`;
            const v = `%${search.trim()}%`;
            params.push(v, v, v);
        }
        if (ativo !== undefined && ativo !== '') {
            sql += ` AND c.ativo = ?`;
            params.push(ativo === '1' || ativo === 'true' || ativo === true ? 1 : 0);
        }
        sql += ` GROUP BY c.id ORDER BY c.nome ASC`;
        const [cursos] = await pool.query(sql, params);
        return res.status(200).json({ success: true, total: cursos.length, data: cursos });
    } catch (error) { next(error); }
};

const getCursoById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            `SELECT c.*, COUNT(e.id) AS total_estudantes
             FROM cursos c
             LEFT JOIN estudantes e ON e.curso_id = c.id
             WHERE c.id = ? 
             GROUP BY c.id 
             LIMIT 1`,
            [id]
        );
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

        const statusAtivo = ativo !== undefined ? (ativo === 1 || ativo === '1' || ativo === true || ativo === 'true' ? 1 : 0) : 1;

        const [resultado] = await pool.query(
            `INSERT INTO cursos (nome, codigo, descricao, ativo) VALUES (?, ?, ?, ?)`,
            [nome.trim(), codigo.trim(), descricao?.trim() || null, statusAtivo]
        );
        const [curso] = await pool.query(
            `SELECT c.*, COUNT(e.id) AS total_estudantes FROM cursos c LEFT JOIN estudantes e ON e.curso_id = c.id WHERE c.id = ? GROUP BY c.id`,
            [resultado.insertId]
        );
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
        if (nome !== undefined) { campos.push('nome = ?'); valores.push(nome.trim()); }
        if (codigo !== undefined) { campos.push('codigo = ?'); valores.push(codigo.trim()); }
        if (descricao !== undefined) { campos.push('descricao = ?'); valores.push(descricao?.trim() || null); }
        if (ativo !== undefined) { 
            campos.push('ativo = ?'); 
            valores.push(ativo === 1 || ativo === '1' || ativo === true || ativo === 'true' ? 1 : 0); 
        }
        if (campos.length === 0) {
            return res.status(400).json({ success: false, message: 'Nenhum campo enviado para actualização.' });
        }
        valores.push(id);
        await pool.query(`UPDATE cursos SET ${campos.join(', ')} WHERE id = ?`, valores);
        const [curso] = await pool.query(
            `SELECT c.*, COUNT(e.id) AS total_estudantes FROM cursos c LEFT JOIN estudantes e ON e.curso_id = c.id WHERE c.id = ? GROUP BY c.id`,
            [id]
        );
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