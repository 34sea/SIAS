const pool = require('../config/db');

/**
 * @swagger
 * tags:
 *   - name: Estudantes
 *     description: Gestão do perfil e registo de estudantes
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     Estudante:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         utilizador_id:
 *           type: integer
 *           example: 2
 *         nome_completo:
 *           type: string
 *           example: "Martinho Domingos"
 *         email:
 *           type: string
 *           format: email
 *           example: "martinho@email.com"
 *         username:
 *           type: string
 *           example: "martinho"
 *         foto:
 *           type: string
 *           nullable: true
 *           example: "uploads/users/user-1.png"
 *         curso_id:
 *           type: integer
 *           example: 3
 *         curso_nome:
 *           type: string
 *           example: "Engenharia Informática"
 *         numero_estudante:
 *           type: string
 *           example: "20240102"
 *         ano_ingresso:
 *           type: integer
 *           example: 2024
 *         ativo:
 *           type: integer
 *           description: "1 para activo, 0 para inactivo"
 *           example: 1
 *         criado_em:
 *           type: string
 *           format: date-time
 *           example: "2026-03-01T08:30:00.000Z"
 *
 *     EstudantesResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         total:
 *           type: integer
 *           example: 10
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Estudante'
 *
 *     EstudanteResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/Estudante'
 *
 *     EstudanteErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Estudante não encontrado."
 */

/**
 * @swagger
 * /api/estudantes:
 *   get:
 *     summary: Listar estudantes
 *     description: Retorna a lista de estudantes cadastrados no sistema, permitindo filtragem por pesquisa textual (nome, email ou número de estudante), curso e estado de actividade.
 *     tags: [Estudantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Pesquisa por nome completo, email ou número de estudante.
 *         example: "Martinho"
 *       - in: query
 *         name: curso_id
 *         schema:
 *           type: integer
 *         description: Filtra os estudantes pelo ID do curso.
 *         example: 3
 *       - in: query
 *         name: ativo
 *         schema:
 *           type: string
 *         description: Filtra pelo estado de actividade (1 / true = Activo, 0 / false = Inactivo).
 *         example: "1"
 *     responses:
 *       200:
 *         description: Lista de estudantes obtida com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EstudantesResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 */

// const getEstudantes = async (req, res, next) => {
//     try {
//         const { search = '', curso_id, ativo } = req.query;
//         let sql = `
//             SELECT e.id, e.utilizador_id, u.nome_completo, u.email, u.username, u.foto,
//                    e.curso_id, c.nome AS curso_nome, e.numero_estudante,
//                    e.ano_ingresso, e.ativo, e.criado_em
//             FROM estudantes e
//             INNER JOIN utilizadores u ON u.id = e.utilizador_id
//             INNER JOIN cursos c ON c.id = e.curso_id
//             WHERE 1=1
//         `;
//         const params = [];
//         if (search.trim() !== '') {
//             sql += ` AND (u.nome_completo LIKE ? OR u.email LIKE ? OR e.numero_estudante LIKE ?)`;
//             const v = `%${search.trim()}%`;
//             params.push(v, v, v);
//         }
//         if (curso_id) {
//             sql += ` AND e.curso_id = ?`;
//             params.push(curso_id);
//         }
//         if (ativo !== undefined && ativo !== '') {
//             sql += ` AND e.ativo = ?`;
//             params.push(ativo === '1' || ativo === 'true' || ativo === true ? 1 : 0);
//         }
//         sql += ` ORDER BY u.nome_completo ASC`;
//         const [estudantes] = await pool.query(sql, params);
//         return res.status(200).json({ success: true, total: estudantes.length, data: estudantes });
//     } catch (error) { next(error); }
// };
const getEstudantes = async (req, res, next) => {
    try {
        const { search = '', curso_id, ativo } = req.query;

        const utilizadorId = Number(req.user?.id);
        const role = String(
            req.user?.role_nome ?? req.user?.role ?? ''
        ).toUpperCase();

        // Validar utilizador autenticado e perfil
        if (
            !Number.isInteger(utilizadorId) ||
            utilizadorId <= 0 ||
            !['ADMIN', 'DOCENTE', 'ESTUDANTE'].includes(role)
        ) {
            return res.status(403).json({
                success: false,
                message: 'Utilizador não autorizado.'
            });
        }

        let sql = `
            SELECT
                e.id,
                e.utilizador_id,
                u.nome_completo,
                u.email,
                u.username,
                u.foto,
                e.curso_id,
                c.nome AS curso_nome,
                e.numero_estudante,
                e.ano_ingresso,
                e.ativo,
                e.criado_em
            FROM estudantes e
            INNER JOIN utilizadores u
                ON u.id = e.utilizador_id
            INNER JOIN cursos c
                ON c.id = e.curso_id
            WHERE 1 = 1
        `;

        const params = [];

        // ESTUDANTE: consultar apenas os próprios dados
        if (role === 'ESTUDANTE') {
            sql += ` AND e.utilizador_id = ?`;
            params.push(utilizadorId);
        }

        // DOCENTE: consultar apenas estudantes com orientação ativa
        if (role === 'DOCENTE') {
            sql += `
                AND EXISTS (
                    SELECT 1
                    FROM orientacoes o
                    INNER JOIN docentes d
                        ON d.id = o.docente_id
                    WHERE o.estudante_id = e.id
                      AND d.utilizador_id = ?
                      AND o.estado = 'ATIVA'
                )
            `;
            params.push(utilizadorId);
        }

        // Pesquisa por nome, email ou número de estudante
        if (
            typeof search === 'string' &&
            search.trim() !== ''
        ) {
            sql += `
                AND (
                    u.nome_completo LIKE ?
                    OR u.email LIKE ?
                    OR e.numero_estudante LIKE ?
                )
            `;

            const valorPesquisa = `%${search.trim()}%`;
            params.push(
                valorPesquisa,
                valorPesquisa,
                valorPesquisa
            );
        }

        // Validar e aplicar filtro por curso
        if (
            curso_id !== undefined &&
            String(curso_id).trim() !== ''
        ) {
            const cursoIdNumero = Number(curso_id);

            if (
                !Number.isInteger(cursoIdNumero) ||
                cursoIdNumero <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do curso inválido.'
                });
            }

            sql += ` AND e.curso_id = ?`;
            params.push(cursoIdNumero);
        }

        // Validar e aplicar filtro de estado ativo
        if (ativo !== undefined && String(ativo).trim() !== '') {
            let ativoNumero;

            if (
                ativo === '1' ||
                ativo === 'true' ||
                ativo === true
            ) {
                ativoNumero = 1;
            } else if (
                ativo === '0' ||
                ativo === 'false' ||
                ativo === false
            ) {
                ativoNumero = 0;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetro ativo inválido. Use 1, 0, true ou false.'
                });
            }

            sql += ` AND e.ativo = ?`;
            params.push(ativoNumero);
        }

        sql += ` ORDER BY u.nome_completo ASC`;

        const [estudantes] = await pool.query(sql, params);

        return res.status(200).json({
            success: true,
            total: estudantes.length,
            data: estudantes
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/estudantes/{id}:
 *   get:
 *     summary: Consultar estudante por ID
 *     description: Retorna os dados detalhados de um estudante específico.
 *     tags: [Estudantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do estudante.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Estudante encontrado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EstudanteResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Estudante não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EstudanteErrorResponse'
 */

const getEstudanteById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            `SELECT e.*, u.nome_completo, u.email, u.username, u.foto, c.nome AS curso_nome
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

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateEstudanteRequest:
 *       type: object
 *       required:
 *         - utilizador_id
 *         - curso_id
 *       properties:
 *         utilizador_id:
 *           type: integer
 *           example: 2
 *         curso_id:
 *           type: integer
 *           example: 3
 *         numero_estudante:
 *           type: string
 *           nullable: true
 *           example: "20240102"
 *         ano_ingresso:
 *           type: integer
 *           nullable: true
 *           example: 2024
 *         ativo:
 *           type: boolean
 *           description: "True/1 para activo, False/0 para inactivo"
 *           example: true
 *
 *     EstudanteCreatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Estudante registado com sucesso."
 *         data:
 *           $ref: '#/components/schemas/Estudante'
 */

/**
 * @swagger
 * /api/estudantes:
 *   post:
 *     summary: Registar novo estudante
 *     description: Associa um utilizador existente a um curso, criando um novo registo de estudante no sistema.
 *     tags: [Estudantes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEstudanteRequest'
 *     responses:
 *       201:
 *         description: Estudante registado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EstudanteCreatedResponse'
 *       400:
 *         description: Campos obrigatórios em falta (utilizador ou curso) ou entidade inexistente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EstudanteErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       409:
 *         description: Este utilizador já se encontra registado como estudante.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EstudanteErrorResponse'
 */

const createEstudante = async (req, res, next) => {
    try {
        const { utilizador_id, curso_id, numero_estudante, ano_ingresso, ativo } = req.body;
        if (!utilizador_id || !curso_id) {
            return res.status(400).json({ success: false, message: 'Utilizador e curso são obrigatórios.' });
        }
        const [utilizador] = await pool.query(`SELECT id FROM utilizadores WHERE id = ? LIMIT 1`, [utilizador_id]);
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

        const statusAtivo = ativo !== undefined ? (ativo === 1 || ativo === '1' || ativo === true || ativo === 'true' ? 1 : 0) : 1;

        const [resultado] = await pool.query(
            `INSERT INTO estudantes (utilizador_id, curso_id, numero_estudante, ano_ingresso, ativo)
             VALUES (?, ?, ?, ?, ?)`,
            [utilizador_id, curso_id, numero_estudante || null, ano_ingresso || null, statusAtivo]
        );
        const [estudante] = await pool.query(
            `SELECT e.*, u.nome_completo, u.email, u.username, u.foto, c.nome AS curso_nome FROM estudantes e
             INNER JOIN utilizadores u ON u.id = e.utilizador_id
             INNER JOIN cursos c ON c.id = e.curso_id WHERE e.id = ?`,
            [resultado.insertId]
        );
        return res.status(201).json({ success: true, message: 'Estudante registado com sucesso.', data: estudante[0] });
    } catch (error) { next(error); }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateEstudanteRequest:
 *       type: object
 *       properties:
 *         curso_id:
 *           type: integer
 *           example: 3
 *         numero_estudante:
 *           type: string
 *           nullable: true
 *           example: "20240102"
 *         ano_ingresso:
 *           type: integer
 *           nullable: true
 *           example: 2024
 *         ativo:
 *           type: boolean
 *           description: "True/1 para activo, False/0 para inactivo"
 *           example: true
 *
 *     EstudanteUpdatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Estudante actualizado com sucesso."
 *         data:
 *           $ref: '#/components/schemas/Estudante'
 */

/**
 * @swagger
 * /api/estudantes/{id}:
 *   put:
 *     summary: Actualizar estudante
 *     description: Actualiza os dados de um estudante existente (como curso, número de estudante, ano de ingresso ou estado de actividade) através do seu ID.
 *     tags: [Estudantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do estudante.
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateEstudanteRequest'
 *     responses:
 *       200:
 *         description: Estudante actualizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EstudanteUpdatedResponse'
 *       400:
 *         description: Nenhum campo enviado para actualização ou ID inválido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EstudanteErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Estudante não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EstudanteErrorResponse'
 *
 *   delete:
 *     summary: Eliminar estudante
 *     description: Remove permanentemente um estudante do sistema através do seu ID.
 *     tags: [Estudantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do estudante.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Estudante eliminado com sucesso.
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
 *                   example: "Estudante eliminado com sucesso."
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Estudante não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EstudanteErrorResponse'
 */

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
        if (ativo !== undefined) { 
            campos.push('ativo = ?'); 
            valores.push(ativo === 1 || ativo === '1' || ativo === true || ativo === 'true' ? 1 : 0); 
        }
        if (campos.length === 0) {
            return res.status(400).json({ success: false, message: 'Nenhum campo enviado para actualização.' });
        }
        valores.push(id);
        await pool.query(`UPDATE estudantes SET ${campos.join(', ')} WHERE id = ?`, valores);
        const [estudante] = await pool.query(
            `SELECT e.*, u.nome_completo, u.email, u.username, u.foto, c.nome AS curso_nome FROM estudantes e
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