const pool = require('../config/db');

/**
 * @swagger
 * tags:
 *   - name: Cursos
 *     description: Gestão dos cursos da instituição
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Curso:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nome:
 *           type: string
 *           example: "Engenharia Informática"
 *         codigo:
 *           type: string
 *           example: "LEI"
 *         descricao:
 *           type: string
 *           nullable: true
 *           example: "Licenciatura em Engenharia Informática"
 *         ativo:
 *           type: integer
 *           description: "1 para activo, 0 para inactivo"
 *           example: 1
 *         criado_em:
 *           type: string
 *           format: date-time
 *           example: "2026-01-15T10:00:00.000Z"
 *         atualizado_em:
 *           type: string
 *           format: date-time
 *           example: "2026-02-01T14:20:00.000Z"
 *         total_estudantes:
 *           type: integer
 *           description: "Número total de estudantes inscritos no curso"
 *           example: 42
 *
 *     CursosResponse:
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
 *             $ref: '#/components/schemas/Curso'
 *
 *     CursoResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/Curso'
 *
 *     CursoErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Curso não encontrado."
 */

/**
 * @swagger
 * /api/cursos:
 *   get:
 *     summary: Listar cursos
 *     description: Retorna a lista de cursos registados na instituição, permitindo filtragem opcional por pesquisa textual (nome, código ou descrição) e estado de actividade, incluindo a contagem total de estudantes por curso.
 *     tags: [Cursos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Pesquisa por nome, código ou descrição do curso.
 *         example: "Informática"
 *       - in: query
 *         name: ativo
 *         schema:
 *           type: string
 *         description: Filtra por estado de actividade (1 / true = Activo, 0 / false = Inactivo).
 *         example: "1"
 *     responses:
 *       200:
 *         description: Lista de cursos obtida com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CursosResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
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
/**
 * @swagger
 * /api/cursos/{id}:
 *   get:
 *     summary: Obter curso por ID
 *     description: Retorna os detalhes completos de um curso específico através do seu ID, incluindo o total de estudantes associados.
 *     tags: [Cursos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do curso.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Curso encontrado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CursoResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Curso não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CursoErrorResponse'
 */
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
/**
 * @swagger
 * components:
 *   schemas:
 *     CreateCursoRequest:
 *       type: object
 *       required:
 *         - nome
 *         - codigo
 *       properties:
 *         nome:
 *           type: string
 *           example: "Engenharia Informática"
 *         codigo:
 *           type: string
 *           example: "LEI"
 *         descricao:
 *           type: string
 *           nullable: true
 *           example: "Licenciatura em Engenharia Informática"
 *         ativo:
 *           type: boolean
 *           description: "True/1 para activo, False/0 para inactivo"
 *           example: true
 *
 *     CursoCreatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Curso criado com sucesso."
 *         data:
 *           $ref: '#/components/schemas/Curso'
 */

/**
 * @swagger
 * /api/cursos:
 *   post:
 *     summary: Criar novo curso
 *     description: Regista um novo curso na instituição com nome, código, descrição opcional e estado de actividade.
 *     tags: [Cursos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCursoRequest'
 *     responses:
 *       201:
 *         description: Curso criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CursoCreatedResponse'
 *       400:
 *         description: Campos obrigatórios em falta (nome ou código).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CursoErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       409:
 *         description: Já existe um curso com este código ou nome.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CursoErrorResponse'
 */
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

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateCursoRequest:
 *       type: object
 *       properties:
 *         nome:
 *           type: string
 *           example: "Engenharia Informática"
 *         codigo:
 *           type: string
 *           example: "LEI"
 *         descricao:
 *           type: string
 *           nullable: true
 *           example: "Licenciatura em Engenharia Informática"
 *         ativo:
 *           type: boolean
 *           description: "True/1 para activo, False/0 para inactivo"
 *           example: true
 *
 *     CursoUpdatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Curso actualizado com sucesso."
 *         data:
 *           $ref: '#/components/schemas/Curso'
 */

/**
 * @swagger
 * /api/cursos/{id}:
 *   put:
 *     summary: Actualizar curso
 *     description: Actualiza os dados de um curso existente (como nome, código, descrição ou estado de actividade) através do seu ID.
 *     tags: [Cursos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do curso.
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCursoRequest'
 *     responses:
 *       200:
 *         description: Curso actualizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CursoUpdatedResponse'
 *       400:
 *         description: Nenhum campo enviado para actualização ou ID inválido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CursoErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Curso não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CursoErrorResponse'
 *
 *   delete:
 *     summary: Eliminar curso
 *     description: Remove permanentemente um curso da instituição através do seu ID.
 *     tags: [Cursos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do curso.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Curso eliminado com sucesso.
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
 *                   example: "Curso eliminado com sucesso."
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Curso não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CursoErrorResponse'
 */

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