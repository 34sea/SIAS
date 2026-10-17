const pool = require('../config/db');

/**
 * @swagger
 * tags:
 *   - name: Docentes
 *     description: Gestão de docentes / orientadores
 */

/**
 * @swagger
 * /api/docentes:
 *   get:
 *     summary: Listar docentes
 *     tags: [Docentes]
 *     security: - bearerAuth: []
 *     responses: 200: { description: Lista de docentes. }
 *   post:
 *     summary: Criar docente
 *     tags: [Docentes]
 *     security: - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [utilizador_id]
 *             properties:
 *               utilizador_id: { type: integer }
 *               departamento: { type: string }
 *               especialidade: { type: string }
 *               grau_academico: { type: string }
 *               numero_funcionario: { type: string }
 *               ativo: { type: boolean }
 *     responses: 201: { description: Docente criado. }
 */
const getDocentes = async (req, res, next) => {
    try {
        const { search = '', ativo } = req.query;
        let sql = `
            SELECT d.id, d.utilizador_id, u.nome_completo, u.email, u.username, u.foto,
                   d.departamento, d.especialidade, d.grau_academico,
                   d.numero_funcionario, d.ativo, d.criado_em
            FROM docentes d
            INNER JOIN utilizadores u ON u.id = d.utilizador_id
            WHERE 1=1
        `;
        const params = [];
        if (search.trim() !== '') {
            sql += ` AND (u.nome_completo LIKE ? OR u.email LIKE ? OR d.especialidade LIKE ? OR d.departamento LIKE ?)`;
            const v = `%${search.trim()}%`;
            params.push(v, v, v, v);
        }
        if (ativo !== undefined && ativo !== '') {
            sql += ` AND d.ativo = ?`;
            params.push(ativo === '1' || ativo === 'true' || ativo === true ? 1 : 0);
        }
        sql += ` ORDER BY u.nome_completo ASC`;
        const [docentes] = await pool.query(sql, params);
        return res.status(200).json({ success: true, total: docentes.length, data: docentes });
    } catch (error) { next(error); }
};

/**
 * @swagger
 * /api/docentes/{id}:
 *   get:
 *     summary: Obter docente por ID
 *     tags: [Docentes]
 *     security: - bearerAuth: []
 *   put:
 *     summary: Actualizar docente
 *     tags: [Docentes]
 *     security: - bearerAuth: []
 *   delete:
 *     summary: Eliminar docente
 *     tags: [Docentes]
 *     security: - bearerAuth: []
 */
const getDocenteById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            `SELECT d.*, u.nome_completo, u.email, u.username, u.foto
             FROM docentes d 
             INNER JOIN utilizadores u ON u.id = d.utilizador_id
             WHERE d.id = ? LIMIT 1`,
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Docente não encontrado.' });
        }
        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) { next(error); }
};

const createDocente = async (req, res, next) => {
    try {
        const { utilizador_id, departamento, especialidade, grau_academico, numero_funcionario, ativo } = req.body;
        if (!utilizador_id) {
            return res.status(400).json({ success: false, message: 'O utilizador é obrigatório.' });
        }
        const [utilizador] = await pool.query(`SELECT id, role_id FROM utilizadores WHERE id = ? LIMIT 1`, [utilizador_id]);
        if (utilizador.length === 0) {
            return res.status(400).json({ success: false, message: 'O utilizador indicado não existe.' });
        }
        const [docenteExistente] = await pool.query(`SELECT id FROM docentes WHERE utilizador_id = ? LIMIT 1`, [utilizador_id]);
        if (docenteExistente.length > 0) {
            return res.status(409).json({ success: false, message: 'Este utilizador já é docente.' });
        }

        const statusAtivo = ativo !== undefined ? (ativo === 1 || ativo === '1' || ativo === true || ativo === 'true' ? 1 : 0) : 1;

        const [resultado] = await pool.query(
            `INSERT INTO docentes (utilizador_id, departamento, especialidade, grau_academico, numero_funcionario, ativo)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [utilizador_id, departamento || null, especialidade || null, grau_academico || null, numero_funcionario || null, statusAtivo]
        );
        const [docente] = await pool.query(
            `SELECT d.*, u.nome_completo, u.email, u.username, u.foto FROM docentes d INNER JOIN utilizadores u ON u.id = d.utilizador_id WHERE d.id = ?`,
            [resultado.insertId]
        );
        return res.status(201).json({ success: true, message: 'Docente registado com sucesso.', data: docente[0] });
    } catch (error) { next(error); }
};

const updateDocente = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { departamento, especialidade, grau_academico, numero_funcionario, ativo } = req.body;
        const [existente] = await pool.query(`SELECT id FROM docentes WHERE id = ? LIMIT 1`, [id]);
        if (existente.length === 0) {
            return res.status(404).json({ success: false, message: 'Docente não encontrado.' });
        }
        const campos = [];
        const valores = [];
        if (departamento !== undefined) { campos.push('departamento = ?'); valores.push(departamento); }
        if (especialidade !== undefined) { campos.push('especialidade = ?'); valores.push(especialidade); }
        if (grau_academico !== undefined) { campos.push('grau_academico = ?'); valores.push(grau_academico); }
        if (numero_funcionario !== undefined) { campos.push('numero_funcionario = ?'); valores.push(numero_funcionario); }
        if (ativo !== undefined) { 
            campos.push('ativo = ?'); 
            valores.push(ativo === 1 || ativo === '1' || ativo === true || ativo === 'true' ? 1 : 0); 
        }
        if (campos.length === 0) {
            return res.status(400).json({ success: false, message: 'Nenhum campo enviado para actualização.' });
        }
        valores.push(id);
        await pool.query(`UPDATE docentes SET ${campos.join(', ')} WHERE id = ?`, valores);
        const [docente] = await pool.query(
            `SELECT d.*, u.nome_completo, u.email, u.username, u.foto FROM docentes d INNER JOIN utilizadores u ON u.id = d.utilizador_id WHERE d.id = ?`,
            [id]
        );
        return res.status(200).json({ success: true, message: 'Docente actualizado com sucesso.', data: docente[0] });
    } catch (error) { next(error); }
};

const deleteDocente = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [existente] = await pool.query(`SELECT id FROM docentes WHERE id = ? LIMIT 1`, [id]);
        if (existente.length === 0) {
            return res.status(404).json({ success: false, message: 'Docente não encontrado.' });
        }
        await pool.query(`DELETE FROM docentes WHERE id = ?`, [id]);
        return res.status(200).json({ success: true, message: 'Docente eliminado com sucesso.' });
    } catch (error) { next(error); }
};

module.exports = { getDocentes, getDocenteById, createDocente, updateDocente, deleteDocente };