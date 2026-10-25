const pool = require('../config/db');

/**
 * @swagger
 * tags:
 *   - name: Orientacoes
 *     description: Gestão da associação entre estudantes e orientadores (docentes)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     Orientacao:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         estudante_id:
 *           type: integer
 *           example: 2
 *         docente_id:
 *           type: integer
 *           example: 1
 *         estudante_nome:
 *           type: string
 *           example: "Martinho Domingos"
 *         estudante_email:
 *           type: string
 *           format: email
 *           example: "martinho@email.com"
 *         estudante_foto:
 *           type: string
 *           nullable: true
 *           example: "uploads/users/user-1.png"
 *         curso_id:
 *           type: integer
 *           example: 3
 *         curso_nome:
 *           type: string
 *           example: "Engenharia Informática"
 *         docente_nome:
 *           type: string
 *           example: "Dr. João Silva"
 *         docente_email:
 *           type: string
 *           format: email
 *           example: "joao.silva@email.com"
 *         docente_foto:
 *           type: string
 *           nullable: true
 *           example: "uploads/users/user-2.png"
 *         data_inicio:
 *           type: string
 *           format: date-time
 *           example: "2026-03-01T00:00:00.000Z"
 *         data_fim:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         estado:
 *           type: string
 *           example: "ACTIVO"
 *         observacoes:
 *           type: string
 *           nullable: true
 *           example: "Orientação principal para o tema de monografia."
 *         criado_em:
 *           type: string
 *           format: date-time
 *           example: "2026-03-01T08:30:00.000Z"
 *
 *     OrientacoesResponse:
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
 *             $ref: '#/components/schemas/Orientacao'
 *
 *     OrientacaoResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/Orientacao'
 *
 *     OrientacaoErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Orientação não encontrada."
 */

/**
 * @swagger
 * /api/orientacoes:
 *   get:
 *     summary: Listar orientações
 *     description: Retorna a lista de orientações registadas, permitindo filtragem opcional por ID do estudante, ID do docente ou estado.
 *     tags: [Orientacoes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estudante_id
 *         schema:
 *           type: integer
 *         description: Filtra as orientações pelo ID do estudante.
 *         example: 2
 *       - in: query
 *         name: docente_id
 *         schema:
 *           type: integer
 *         description: Filtra as orientações pelo ID do docente.
 *         example: 1
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Filtra pelo estado da orientação (ex. ACTIVO, CONCLUIDO, CANCELADO).
 *         example: "ACTIVO"
 *     responses:
 *       200:
 *         description: Lista de orientações obtida com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrientacoesResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 */

// const getOrientacoes = async (req, res, next) => {
//     try {
//         const { estudante_id, docente_id, estado } = req.query;

//         let sql = `
//             SELECT
//                 o.id,
//                 o.estudante_id,
//                 o.docente_id,

//                 -- Dados do estudante
//                 ue.nome_completo AS estudante_nome,
//                 ue.email AS estudante_email,
//                 ue.foto AS estudante_foto,

//                 -- Dados do curso do estudante
//                 c.id AS curso_id,
//                 c.nome AS curso_nome,

//                 -- Dados do docente
//                 ud.nome_completo AS docente_nome,
//                 ud.email AS docente_email,
//                 ud.foto AS docente_foto,

//                 -- Dados da orientação
//                 o.data_inicio,
//                 o.data_fim,
//                 o.estado,
//                 o.observacoes,
//                 o.criado_em

//             FROM orientacoes o

//             INNER JOIN estudantes e
//                 ON e.id = o.estudante_id

//             INNER JOIN utilizadores ue
//                 ON ue.id = e.utilizador_id

//             INNER JOIN cursos c
//                 ON c.id = e.curso_id

//             INNER JOIN docentes d
//                 ON d.id = o.docente_id

//             INNER JOIN utilizadores ud
//                 ON ud.id = d.utilizador_id

//             WHERE 1=1
//         `;

//         const params = [];

//         if (estudante_id) {
//             sql += ` AND o.estudante_id = ?`;
//             params.push(estudante_id);
//         }

//         if (docente_id) {
//             sql += ` AND o.docente_id = ?`;
//             params.push(docente_id);
//         }

//         if (estado) {
//             sql += ` AND o.estado = ?`;
//             params.push(estado);
//         }

//         sql += ` ORDER BY o.criado_em DESC`;

//         const [orientacoes] = await pool.query(sql, params);

//         return res.status(200).json({
//             success: true,
//             total: orientacoes.length,
//             data: orientacoes
//         });

//     } catch (error) {
//         next(error);
//     }
// };

const getOrientacoes = async (req, res, next) => {
    try {
        const { estudante_id, docente_id, estado } = req.query;

        // Dados definidos pelo middleware JWT após validar o token.
        const utilizadorId = Number(req.user?.id);

        const role = String(
            req.user?.role_nome ?? req.user?.role ?? ''
        ).toUpperCase();

    

        let sql = `
            SELECT
                o.id,
                o.estudante_id,
                o.docente_id,

                -- Dados do estudante
                ue.nome_completo AS estudante_nome,
                ue.email AS estudante_email,
                ue.foto AS estudante_foto,

                -- Dados do curso
                c.id AS curso_id,
                c.nome AS curso_nome,

                -- Dados do docente
                ud.nome_completo AS docente_nome,
                ud.email AS docente_email,
                ud.foto AS docente_foto,

                -- Dados da orientação
                o.data_inicio,
                o.data_fim,
                o.estado,
                o.observacoes,
                o.criado_em

            FROM orientacoes o

            INNER JOIN estudantes e
                ON e.id = o.estudante_id

            INNER JOIN utilizadores ue
                ON ue.id = e.utilizador_id

            INNER JOIN cursos c
                ON c.id = e.curso_id

            INNER JOIN docentes d
                ON d.id = o.docente_id

            INNER JOIN utilizadores ud
                ON ud.id = d.utilizador_id

            WHERE 1 = 1
        `;

        const params = [];

        // ==========================================
        // 1. RESTRIÇÃO OBRIGATÓRIA POR ROLE
        // ==========================================

        if (role === 'ESTUDANTE') {
            // Apenas orientações do estudante autenticado.
            sql += `
                AND e.utilizador_id = ?
            `;

            params.push(utilizadorId);
        }

        if (role === 'DOCENTE') {
            // Apenas orientações do docente autenticado.
            sql += `
                AND d.utilizador_id = ?
            `;

            params.push(utilizadorId);
        }

        // ADMIN pode consultar todas as orientações.

        // ==========================================
        // 2. FILTRO POR ESTUDANTE
        // ==========================================

        if (
            estudante_id !== undefined &&
            String(estudante_id).trim() !== ''
        ) {
            const estudanteIdNumero = Number(estudante_id);

            if (
                !Number.isInteger(estudanteIdNumero) ||
                estudanteIdNumero <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do estudante inválido.'
                });
            }

            sql += ` AND o.estudante_id = ?`;
            params.push(estudanteIdNumero);
        }

        // ==========================================
        // 3. FILTRO POR DOCENTE
        // ==========================================

        if (
            docente_id !== undefined &&
            String(docente_id).trim() !== ''
        ) {
            const docenteIdNumero = Number(docente_id);

            if (
                !Number.isInteger(docenteIdNumero) ||
                docenteIdNumero <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do docente inválido.'
                });
            }

            sql += ` AND o.docente_id = ?`;
            params.push(docenteIdNumero);
        }

        // ==========================================
        // 4. FILTRO POR ESTADO
        // ==========================================

        if (
            estado !== undefined &&
            String(estado).trim() !== ''
        ) {
            const estadosPermitidos = [
                'ATIVA',
                'CONCLUIDA',
                'CANCELADA'
            ];

            if (!estadosPermitidos.includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado da orientação inválido.'
                });
            }

            sql += ` AND o.estado = ?`;
            params.push(estado);
        }

        // ==========================================
        // 5. EXECUÇÃO
        // ==========================================

        sql += ` ORDER BY o.criado_em DESC`;

        const [orientacoes] = await pool.query(sql, params);

        return res.status(200).json({
            success: true,
            total: orientacoes.length,
            data: orientacoes
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/orientacoes/{id}:
 *   get:
 *     summary: Consultar orientação por ID
 *     description: Retorna os dados detalhados de uma associação específica entre estudante e orientador.
 *     tags: [Orientacoes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da orientação.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Orientação encontrada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrientacaoResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Orientação não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrientacaoErrorResponse'
 */
const getOrientacaoById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            `SELECT o.*, 
                    ue.nome_completo AS estudante_nome, ue.email AS estudante_email, ue.foto AS estudante_foto, 
                    ud.nome_completo AS docente_nome, ud.email AS docente_email, ud.foto AS docente_foto
             FROM orientacoes o
             INNER JOIN estudantes e ON e.id = o.estudante_id
             INNER JOIN utilizadores ue ON ue.id = e.utilizador_id
             INNER JOIN docentes d ON d.id = o.docente_id
             INNER JOIN utilizadores ud ON ud.id = d.utilizador_id
             WHERE o.id = ? LIMIT 1`,
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Orientação não encontrada.' });
        }
        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) { next(error); }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateOrientacaoRequest:
 *       type: object
 *       required:
 *         - estudante_id
 *         - docente_id
 *       properties:
 *         estudante_id:
 *           type: integer
 *           example: 2
 *         docente_id:
 *           type: integer
 *           example: 1
 *         data_inicio:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2026-03-01"
 *         data_fim:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: null
 *         estado:
 *           type: string
 *           example: "ACTIVA"
 *         observacoes:
 *           type: string
 *           nullable: true
 *           example: "Acompanhamento inicial da monografia."
 *
 *     UpdateOrientacaoRequest:
 *       type: object
 *       properties:
 *         data_inicio:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2026-03-01"
 *         data_fim:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2026-11-30"
 *         estado:
 *           type: string
 *           example: "CONCLUIDA"
 *         observacoes:
 *           type: string
 *           nullable: true
 *           example: "Orientação concluída com sucesso."
 *
 *     OrientacaoCreatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Orientação criada com sucesso."
 *         data:
 *           $ref: '#/components/schemas/Orientacao'
 *
 *     OrientacaoUpdatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Orientação actualizada com sucesso."
 *         data:
 *           $ref: '#/components/schemas/Orientacao'
 */

/**
 * @swagger
 * /api/orientacoes:
 *   post:
 *     summary: Criar nova orientação
 *     description: Associa um estudante a um docente para fins de orientação académica.
 *     tags: [Orientacoes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrientacaoRequest'
 *     responses:
 *       201:
 *         description: Orientação criada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrientacaoCreatedResponse'
 *       400:
 *         description: Estudante e docente são obrigatórios ou não encontrados.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrientacaoErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 */

const createOrientacao = async (req, res, next) => {
    try {
        const { estudante_id, docente_id, data_inicio, data_fim, estado, observacoes } = req.body;
        if (!estudante_id || !docente_id) {
            return res.status(400).json({ success: false, message: 'Estudante e docente são obrigatórios.' });
        }
        const [estudante] = await pool.query(`SELECT id FROM estudantes WHERE id = ? LIMIT 1`, [estudante_id]);
        if (estudante.length === 0) {
            return res.status(400).json({ success: false, message: 'Estudante não encontrado.' });
        }
        const [docente] = await pool.query(`SELECT id FROM docentes WHERE id = ? LIMIT 1`, [docente_id]);
        if (docente.length === 0) {
            return res.status(400).json({ success: false, message: 'Docente não encontrado.' });
        }
        const [resultado] = await pool.query(
            `INSERT INTO orientacoes (estudante_id, docente_id, data_inicio, data_fim, estado, observacoes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [estudante_id, docente_id, data_inicio || null, data_fim || null, estado || 'ATIVA', observacoes || null]
        );
        const [orientacao] = await pool.query(
            `SELECT o.*, 
                    ue.nome_completo AS estudante_nome, ue.email AS estudante_email, ue.foto AS estudante_foto, 
                    ud.nome_completo AS docente_nome, ud.email AS docente_email, ud.foto AS docente_foto
             FROM orientacoes o
             INNER JOIN estudantes e ON e.id = o.estudante_id
             INNER JOIN utilizadores ue ON ue.id = e.utilizador_id
             INNER JOIN docentes d ON d.id = o.docente_id
             INNER JOIN utilizadores ud ON ud.id = d.utilizador_id
             WHERE o.id = ?`,
            [resultado.insertId]
        );
        return res.status(201).json({ success: true, message: 'Orientação criada com sucesso.', data: orientacao[0] });
    } catch (error) { next(error); }
};
/**
 * @swagger
 * /api/orientacoes/{id}:
 *   put:
 *     summary: Actualizar orientação
 *     description: Actualiza os dados de uma orientação existente (como datas, estado ou observações).
 *     tags: [Orientacoes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da orientação.
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOrientacaoRequest'
 *     responses:
 *       200:
 *         description: Orientação actualizada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrientacaoUpdatedResponse'
 *       400:
 *         description: Nenhum campo enviado para actualização.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrientacaoErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Orientação não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrientacaoErrorResponse'
 */
const updateOrientacao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { data_inicio, data_fim, estado, observacoes } = req.body;
        const [existente] = await pool.query(`SELECT id FROM orientacoes WHERE id = ? LIMIT 1`, [id]);
        if (existente.length === 0) {
            return res.status(404).json({ success: false, message: 'Orientação não encontrada.' });
        }
        const campos = [];
        const valores = [];
        if (data_inicio !== undefined) { campos.push('data_inicio = ?'); valores.push(data_inicio); }
        if (data_fim !== undefined) { campos.push('data_fim = ?'); valores.push(data_fim); }
        if (estado !== undefined) { campos.push('estado = ?'); valores.push(estado); }
        if (observacoes !== undefined) { campos.push('observacoes = ?'); valores.push(observacoes); }
        if (campos.length === 0) {
            return res.status(400).json({ success: false, message: 'Nenhum campo enviado para actualização.' });
        }
        valores.push(id);
        await pool.query(`UPDATE orientacoes SET ${campos.join(', ')} WHERE id = ?`, valores);
        const [orientacao] = await pool.query(
            `SELECT o.*, 
                    ue.nome_completo AS estudante_nome, ue.email AS estudante_email, ue.foto AS estudante_foto, 
                    ud.nome_completo AS docente_nome, ud.email AS docente_email, ud.foto AS docente_foto
             FROM orientacoes o
             INNER JOIN estudantes e ON e.id = o.estudante_id
             INNER JOIN utilizadores ue ON ue.id = e.utilizador_id
             INNER JOIN docentes d ON d.id = o.docente_id
             INNER JOIN utilizadores ud ON ud.id = d.utilizador_id
             WHERE o.id = ?`,
            [id]
        );
        return res.status(200).json({ success: true, message: 'Orientação actualizada com sucesso.', data: orientacao[0] });
    } catch (error) { next(error); }
};
/**
 * @swagger
 * /api/orientacoes/{id}:
 *   delete:
 *     summary: Eliminar orientação
 *     description: Remove permanentemente uma orientação do sistema através do seu ID.
 *     tags: [Orientacoes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da orientação.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Orientação eliminada com sucesso.
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
 *                   example: "Orientação eliminada com sucesso."
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Orientação não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrientacaoErrorResponse'
 */
const deleteOrientacao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [existente] = await pool.query(`SELECT id FROM orientacoes WHERE id = ? LIMIT 1`, [id]);
        if (existente.length === 0) {
            return res.status(404).json({ success: false, message: 'Orientação não encontrada.' });
        }
        await pool.query(`DELETE FROM orientacoes WHERE id = ?`, [id]);
        return res.status(200).json({ success: true, message: 'Orientação eliminada com sucesso.' });
    } catch (error) { next(error); }
};
/**
 * @swagger
 * /api/orientacoes/estudante/{estudante_id}:
 *   get:
 *     summary: Listar orientações por ID do estudante
 *     description: Retorna todas as orientações associadas a um estudante específico.
 *     tags: [Orientacoes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: estudante_id
 *         required: true
 *         description: ID do estudante.
 *         schema:
 *           type: integer
 *         example: 2
 *     responses:
 *       200:
 *         description: Lista de orientações obtida com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrientacoesResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 */
const getOrientacoesByEstudante = async (req, res, next) => {
    try {
        const { estudante_id } = req.params;
        const [orientacoes] = await pool.query(
            `SELECT o.*, 
                    ue.nome_completo AS estudante_nome, ue.email AS estudante_email, ue.foto AS estudante_foto, 
                    ud.nome_completo AS docente_nome, ud.email AS docente_email, ud.foto AS docente_foto
             FROM orientacoes o
             INNER JOIN estudantes e ON e.id = o.estudante_id
             INNER JOIN utilizadores ue ON ue.id = e.utilizador_id
             INNER JOIN docentes d ON d.id = o.docente_id
             INNER JOIN utilizadores ud ON ud.id = d.utilizador_id
             WHERE o.estudante_id = ?`,
            [estudante_id]
        );
        return res.status(200).json({ success: true, total: orientacoes.length, data: orientacoes });
    } catch (error) { next(error); }
};

module.exports = { getOrientacoes, getOrientacaoById, createOrientacao, updateOrientacao, deleteOrientacao, getOrientacoesByEstudante };