const pool = require('../config/db');
/**
 * @swagger
 * tags:
 *   - name: Docentes
 *     description: Gestão de docentes / orientadores
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Docente:
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
 *           example: "Dr. João Silva"
 *         email:
 *           type: string
 *           format: email
 *           example: "joao.silva@email.com"
 *         username:
 *           type: string
 *           example: "joao.silva"
 *         foto:
 *           type: string
 *           nullable: true
 *           example: "uploads/users/docente-1.png"
 *         departamento:
 *           type: string
 *           nullable: true
 *           example: "Departamento de Engenharia Informática"
 *         especialidade:
 *           type: string
 *           nullable: true
 *           example: "Inteligência Artificial e Sistemas Distribuídos"
 *         grau_academico:
 *           type: string
 *           nullable: true
 *           example: "Doutoramento"
 *         numero_funcionario:
 *           type: string
 *           nullable: true
 *           example: "DOC202401"
 *         ativo:
 *           type: integer
 *           description: "1 para activo, 0 para inactivo"
 *           example: 1
 *         criado_em:
 *           type: string
 *           format: date-time
 *           example: "2026-03-01T08:30:00.000Z"
 *
 *     CreateDocenteRequest:
 *       type: object
 *       required:
 *         - utilizador_id
 *       properties:
 *         utilizador_id:
 *           type: integer
 *           example: 2
 *         departamento:
 *           type: string
 *           nullable: true
 *           example: "Departamento de Engenharia Informática"
 *         especialidade:
 *           type: string
 *           nullable: true
 *           example: "Inteligência Artificial"
 *         grau_academico:
 *           type: string
 *           nullable: true
 *           example: "Doutoramento"
 *         numero_funcionario:
 *           type: string
 *           nullable: true
 *           example: "DOC202401"
 *         ativo:
 *           type: boolean
 *           example: true
 *
 *     UpdateDocenteRequest:
 *       type: object
 *       properties:
 *         departamento:
 *           type: string
 *           nullable: true
 *           example: "Departamento de Engenharia Informática"
 *         especialidade:
 *           type: string
 *           nullable: true
 *           example: "Sistemas Distribuídos"
 *         grau_academico:
 *           type: string
 *           nullable: true
 *           example: "Mestrado"
 *         numero_funcionario:
 *           type: string
 *           nullable: true
 *           example: "DOC202401"
 *         ativo:
 *           type: boolean
 *           example: true
 *
 *     DocentesResponse:
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
 *             $ref: '#/components/schemas/Docente'
 *
 *     DocenteResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/Docente'
 *
 *     DocenteErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Docente não encontrado."
 */

/**
 * @swagger
 * /api/docentes:
 *   get:
 *     summary: Listar docentes
 *     description: Retorna a lista de docentes registados, permitindo filtragem opcional por texto (nome, email, especialidade ou departamento) e estado de actividade.
 *     tags: [Docentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Pesquisa textual por nome, email, especialidade ou departamento.
 *         example: "Inteligência"
 *       - in: query
 *         name: ativo
 *         schema:
 *           type: string
 *         description: Filtra por estado de actividade (1 / true ou 0 / false).
 *         example: "1"
 *     responses:
 *       200:
 *         description: Lista de docentes obtida com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocentesResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *
 *   post:
 *     summary: Criar docente
 *     description: Associa um utilizador existente ao perfil de docente no sistema.
 *     tags: [Docentes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDocenteRequest'
 *     responses:
 *       201:
 *         description: Docente criado com sucesso.
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
 *                   example: "Docente criado com sucesso."
 *                 data:
 *                   $ref: '#/components/schemas/Docente'
 *       400:
 *         description: Dados inválidos ou utilizador obrigatório em falta.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocenteErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       409:
 *         description: O utilizador já se encontra registado como docente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocenteErrorResponse'
 */
// const getDocentes = async (req, res, next) => {
//     try {
//         const { search = '', ativo } = req.query;
//         let sql = `
//             SELECT d.id, d.utilizador_id, u.nome_completo, u.email, u.username, u.foto,
//                    d.departamento, d.especialidade, d.grau_academico,
//                    d.numero_funcionario, d.ativo, d.criado_em
//             FROM docentes d
//             INNER JOIN utilizadores u ON u.id = d.utilizador_id
//             WHERE 1=1
//         `;
//         const params = [];
//         if (search.trim() !== '') {
//             sql += ` AND (u.nome_completo LIKE ? OR u.email LIKE ? OR d.especialidade LIKE ? OR d.departamento LIKE ?)`;
//             const v = `%${search.trim()}%`;
//             params.push(v, v, v, v);
//         }
//         if (ativo !== undefined && ativo !== '') {
//             sql += ` AND d.ativo = ?`;
//             params.push(ativo === '1' || ativo === 'true' || ativo === true ? 1 : 0);
//         }
//         sql += ` ORDER BY u.nome_completo ASC`;
//         const [docentes] = await pool.query(sql, params);
//         return res.status(200).json({ success: true, total: docentes.length, data: docentes });
//     } catch (error) { next(error); }
// };

const getDocentes = async (req, res, next) => {
    try {
        const { search = '', ativo } = req.query;

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
                d.id,
                d.utilizador_id,
                u.nome_completo,
                u.email,
                u.username,
                u.foto,
                d.departamento,
                d.especialidade,
                d.grau_academico,
                d.numero_funcionario,
                d.ativo,
                d.criado_em
            FROM docentes d
            INNER JOIN utilizadores u
                ON u.id = d.utilizador_id
            WHERE 1 = 1
        `;

        const params = [];

        // DOCENTE: consultar apenas os próprios dados
        if (role === 'DOCENTE') {
            sql += ` AND d.utilizador_id = ?`;
            params.push(utilizadorId);
        }

        // ESTUDANTE: consultar apenas docentes das suas
        // orientações ativas
        if (role === 'ESTUDANTE') {
            sql += `
                AND EXISTS (
                    SELECT 1
                    FROM orientacoes o
                    INNER JOIN estudantes e
                        ON e.id = o.estudante_id
                    WHERE o.docente_id = d.id
                      AND e.utilizador_id = ?
                      AND o.estado = 'ATIVA'
                )
            `;
            params.push(utilizadorId);
        }

        // Pesquisa por nome, email, especialidade ou departamento
        if (
            typeof search === 'string' &&
            search.trim() !== ''
        ) {
            sql += `
                AND (
                    u.nome_completo LIKE ?
                    OR u.email LIKE ?
                    OR d.especialidade LIKE ?
                    OR d.departamento LIKE ?
                )
            `;

            const valorPesquisa = `%${search.trim()}%`;
            params.push(
                valorPesquisa,
                valorPesquisa,
                valorPesquisa,
                valorPesquisa
            );
        }

        // Validar o filtro de estado ativo
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

            sql += ` AND d.ativo = ?`;
            params.push(ativoNumero);
        }

        sql += ` ORDER BY u.nome_completo ASC`;

        const [docentes] = await pool.query(sql, params);

        return res.status(200).json({
            success: true,
            total: docentes.length,
            data: docentes
        });

    } catch (error) {
        next(error);
    }
};
/**
 * @swagger
 * /api/docentes/{id}:
 *   get:
 *     summary: Obter docente por ID
 *     description: Retorna os detalhes completos de um docente específico através do seu ID.
 *     tags: [Docentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do docente.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Docente encontrado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocenteResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Docente não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocenteErrorResponse'
 *
 *   put:
 *     summary: Actualizar docente
 *     description: Actualiza os dados profissionais e académicos de um docente existente.
 *     tags: [Docentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do docente.
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDocenteRequest'
 *     responses:
 *       200:
 *         description: Docente actualizado com sucesso.
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
 *                   example: "Docente actualizado com sucesso."
 *                 data:
 *                   $ref: '#/components/schemas/Docente'
 *       400:
 *         description: Dados inválidos ou nenhum campo enviado para actualização.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocenteErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Docente não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocenteErrorResponse'
 *
 *   delete:
 *     summary: Eliminar docente
 *     description: Remove permanentemente um docente do sistema através do seu ID.
 *     tags: [Docentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do docente.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Docente eliminado com sucesso.
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
 *                   example: "Docente eliminado com sucesso."
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Docente não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocenteErrorResponse'
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

/**
 * @swagger
 * components:
 *   schemas:
 *     DocenteCreatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Docente registado com sucesso."
 *         data:
 *           $ref: '#/components/schemas/Docente'
 */

/**
 * @swagger
 * /api/docentes:
 *   post:
 *     summary: Registar novo docente
 *     description: Associa um utilizador existente ao perfil de docente, criando um novo registo no sistema com as informações académicas e profissionais fornecidas.
 *     tags: [Docentes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDocenteRequest'
 *     responses:
 *       201:
 *         description: Docente registado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocenteCreatedResponse'
 *       400:
 *         description: Campo obrigatório em falta (utilizador_id) ou utilizador inexistente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocenteErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       409:
 *         description: Este utilizador já se encontra registado como docente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocenteErrorResponse'
 */

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
/**
 * @swagger
 * components:
 *   schemas:
 *     DocenteUpdatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Docente actualizado com sucesso."
 *         data:
 *           $ref: '#/components/schemas/Docente'
 */

/**
 * @swagger
 * /api/docentes/{id}:
 *   put:
 *     summary: Actualizar docente
 *     description: Actualiza os dados profissionais e académicos de um docente existente (como departamento, especialidade, grau académico, número de funcionário ou estado de actividade) através do seu ID.
 *     tags: [Docentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do docente.
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDocenteRequest'
 *     responses:
 *       200:
 *         description: Docente actualizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocenteUpdatedResponse'
 *       400:
 *         description: Nenhum campo enviado para actualização ou ID inválido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocenteErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Docente não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocenteErrorResponse'
 *
 *   delete:
 *     summary: Eliminar docente
 *     description: Remove permanentemente um docente do sistema através do seu ID.
 *     tags: [Docentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do docente.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Docente eliminado com sucesso.
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
 *                   example: "Docente eliminado com sucesso."
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Docente não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocenteErrorResponse'
 */
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