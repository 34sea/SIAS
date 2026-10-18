const pool = require('../config/db');
const fs = require('fs/promises');
const {
    extrairTexto,
    preprocessarTexto
} = require('../services/pythonService');
/**
 * @swagger
 * tags:
 *   - name: DocumentosComparacao
 *     description: Base documental de comparação (gestão pelo admin)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     DocumentoComparacao:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         titulo:
 *           type: string
 *           example: "Estudo sobre Redes Neurais"
 *         autor:
 *           type: string
 *           example: "Carlos Alberto"
 *         ano:
 *           type: integer
 *           example: 2025
 *         curso_id:
 *           type: integer
 *           nullable: true
 *           example: 3
 *         curso_nome:
 *           type: string
 *           nullable: true
 *           example: "Engenharia Informática"
 *         nome_ficheiro:
 *           type: string
 *           example: "documento-1712345678.pdf"
 *         hash_sha256:
 *           type: string
 *           example: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
 *         ativo:
 *           type: integer
 *           description: "1 para activo, 0 para inactivo"
 *           example: 1
 *         excluir_da_comparacao:
 *           type: integer
 *           description: "1 para excluir, 0 para incluir"
 *           example: 0
 *         motivo_exclusao:
 *           type: string
 *           nullable: true
 *           example: null
 *         criado_em:
 *           type: string
 *           format: date-time
 *           example: "2026-03-01T08:30:00.000Z"
 *
 *     CreateDocumentoComparacaoRequest:
 *       type: object
 *       required:
 *         - titulo
 *         - autor
 *         - ano
 *         - ficheiro
 *       properties:
 *         titulo:
 *           type: string
 *           example: "Estudo sobre Redes Neurais"
 *         autor:
 *           type: string
 *           example: "Carlos Alberto"
 *         ano:
 *           type: integer
 *           example: 2025
 *         curso_id:
 *           type: integer
 *           nullable: true
 *           example: 3
 *         ativo:
 *           type: boolean
 *           example: true
 *         excluir_da_comparacao:
 *           type: boolean
 *           example: false
 *         motivo_exclusao:
 *           type: string
 *           nullable: true
 *           example: ""
 *         ficheiro:
 *           type: string
 *           format: binary
 *           description: Ficheiro PDF do documento de referência.
 *
 *     DocumentosComparacaoResponse:
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
 *             $ref: '#/components/schemas/DocumentoComparacao'
 *
 *     DocumentoComparacaoResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/DocumentoComparacao'
 *
 *     DocumentoComparacaoErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Documento não encontrado."
 */

/**
 * @swagger
 * /api/documentos-comparacao:
 *   get:
 *     summary: Listar documentos de comparação
 *     description: Retorna a lista de documentos da base de comparação, permitindo filtros opcionais por texto (título ou autor), estado de actividade ou exclusão.
 *     tags: [DocumentosComparacao]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filtra pelo título do documento ou nome do autor.
 *         example: "Redes"
 *       - in: query
 *         name: ativo
 *         schema:
 *           type: string
 *         description: Filtra pelo estado activo (1 / true ou 0 / false).
 *         example: "1"
 *       - in: query
 *         name: excluir
 *         schema:
 *           type: string
 *         description: Filtra pelo estado de exclusão da comparação (1 / true ou 0 / false).
 *         example: "0"
 *     responses:
 *       200:
 *         description: Lista de documentos obtida com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentosComparacaoResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *
 *   post:
 *     summary: Criar documento de comparação
 *     description: Faz upload de um novo documento de referência e regista-o na base de dados para análises de similaridade.
 *     tags: [DocumentosComparacao]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreateDocumentoComparacaoRequest'
 *     responses:
 *       201:
 *         description: Documento de comparação criado com sucesso.
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
 *                   example: "Documento criado com sucesso."
 *                 data:
 *                   $ref: '#/components/schemas/DocumentoComparacao'
 *       400:
 *         description: Campos obrigatórios em falta ou ficheiro não enviado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentoComparacaoErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 */
const getDocumentosComparacao = async (req, res, next) => {
    try {
        const { search = '', ativo, excluir } = req.query;
        let sql = `
            SELECT dc.id, dc.titulo, dc.autor, dc.ano, dc.curso_id, c.nome AS curso_nome,
                   dc.nome_ficheiro, dc.hash_sha256, dc.ativo, dc.excluir_da_comparacao,
                   dc.motivo_exclusao, dc.criado_em
            FROM documentos_comparacao dc
            LEFT JOIN cursos c ON c.id = dc.curso_id
            WHERE 1=1
        `;
        const params = [];
        if (search.trim() !== '') {
            sql += ` AND (dc.titulo LIKE ? OR dc.autor LIKE ?)`;
            const v = `%${search.trim()}%`;
            params.push(v, v);
        }
        if (ativo !== undefined) {
            sql += ` AND dc.ativo = ?`;
            params.push(ativo === '1' || ativo === true ? 1 : 0);
        }
        if (excluir !== undefined) {
            sql += ` AND dc.excluir_da_comparacao = ?`;
            params.push(excluir === '1' || excluir === true ? 1 : 0);
        }
        sql += ` ORDER BY dc.criado_em DESC`;
        const [documentos] = await pool.query(sql, params);
        return res.status(200).json({ success: true, total: documentos.length, data: documentos });
    } catch (error) { next(error); }
};

/**
 * @swagger
 * /api/documentos-comparacao/{id}:
 *   get:
 *     summary: Obter documento de comparação
 *     description: Retorna os detalhes completos de um documento de comparação específico através do seu ID.
 *     tags: [DocumentosComparacao]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do documento de comparação.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Documento encontrado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentoComparacaoResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Documento não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentoComparacaoErrorResponse'
 *
 *   put:
 *     summary: Actualizar documento de comparação
 *     description: Actualiza os metadados de um documento de comparação existente.
 *     tags: [DocumentosComparacao]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do documento de comparação.
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: "Estudo sobre Redes Neurais Avançadas"
 *               autor:
 *                 type: string
 *                 example: "Carlos Alberto"
 *               ano:
 *                 type: integer
 *                 example: 2026
 *               curso_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 3
 *               ativo:
 *                 type: boolean
 *                 example: true
 *               excluir_da_comparacao:
 *                 type: boolean
 *                 example: false
 *               motivo_exclusao:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *     responses:
 *       200:
 *         description: Documento actualizado com sucesso.
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
 *                   example: "Documento actualizado com sucesso."
 *                 data:
 *                   $ref: '#/components/schemas/DocumentoComparacao'
 *       400:
 *         description: Dados inválidos ou nenhum campo enviado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentoComparacaoErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Documento não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentoComparacaoErrorResponse'
 *
 *   delete:
 *     summary: Eliminar documento de comparação
 *     description: Remove permanentemente um documento de comparação da base de dados.
 *     tags: [DocumentosComparacao]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do documento de comparação.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Documento eliminado com sucesso.
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
 *                   example: "Documento eliminado com sucesso."
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Documento não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentoComparacaoErrorResponse'
 */
const getDocumentoComparacaoById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            `SELECT dc.*, c.nome AS curso_nome
             FROM documentos_comparacao dc
             LEFT JOIN cursos c ON c.id = dc.curso_id
             WHERE dc.id = ? LIMIT 1`,
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Documento não encontrado.' });
        }
        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) { next(error); }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateDocumentoComparacaoRequest:
 *       type: object
 *       required:
 *         - titulo
 *         - ficheiro
 *       properties:
 *         titulo:
 *           type: string
 *           description: Título do documento de referência.
 *           example: "Estudo sobre Redes Neurais e Aprendizagem Profunda"
 *         autor:
 *           type: string
 *           nullable: true
 *           description: Nome do autor do documento.
 *           example: "Carlos Alberto"
 *         ano:
 *           type: integer
 *           nullable: true
 *           description: Ano de publicação do documento.
 *           example: 2025
 *         curso_id:
 *           type: integer
 *           nullable: true
 *           description: ID do curso associado.
 *           example: 3
 *         ativo:
 *           type: boolean
 *           description: Define se o documento está activo no sistema.
 *           example: true
 *         excluir_da_comparacao:
 *           type: boolean
 *           description: Indica se o documento deve ser ignorado na comparação.
 *           example: false
 *         motivo_exclusao:
 *           type: string
 *           nullable: true
 *           description: Motivo para excluir o documento da comparação.
 *           example: ""
 *         criado_por:
 *           type: integer
 *           nullable: true
 *           description: ID do utilizador (administrador) que criou o registo.
 *           example: 1
 *         ficheiro:
 *           type: string
 *           format: binary
 *           description: Ficheiro (PDF, DOC ou DOCX) contendo o texto para extração.
 *
 *     DocumentoComparacaoCriado:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         titulo:
 *           type: string
 *           example: "Estudo sobre Redes Neurais e Aprendizagem Profunda"
 *         autor:
 *           type: string
 *           nullable: true
 *           example: "Carlos Alberto"
 *         ano:
 *           type: integer
 *           nullable: true
 *           example: 2025
 *         curso_id:
 *           type: integer
 *           nullable: true
 *           example: 3
 *         nome_ficheiro:
 *           type: string
 *           example: "estudo-redes.pdf"
 *         caminho_ficheiro:
 *           type: string
 *           example: "uploads/comparacao/estudo-redes.pdf"
 *         tamanho_extraido:
 *           type: integer
 *           description: Quantidade de caracteres do texto extraído.
 *           example: 15420
 *         tamanho_processado:
 *           type: integer
 *           description: Quantidade de caracteres do texto processado.
 *           example: 12100
 *         ativo:
 *           type: integer
 *           example: 1
 *         excluir_da_comparacao:
 *           type: integer
 *           example: 0
 *
 *     DocumentoComparacaoCriadoResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Documento carregado e preparado para comparação."
 *         data:
 *           $ref: '#/components/schemas/DocumentoComparacaoCriado'
 */

/**
 * @swagger
 * /api/documentos-comparacao:
 *   post:
 *     summary: Criar documento de comparação com extração e pré-processamento de texto
 *     description: Realiza o upload de um ficheiro (PDF, DOC ou DOCX), invoca o serviço Python para extrair e pré-processar o texto contido e armazena os metadados e os textos preparados na base de dados para análises de similaridade.
 *     tags: [DocumentosComparacao]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreateDocumentoComparacaoRequest'
 *     responses:
 *       201:
 *         description: Documento carregado, processado e gravado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentoComparacaoCriadoResponse'
 *       400:
 *         description: Título obrigatório em falta ou nenhum ficheiro enviado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentoComparacaoErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       422:
 *         description: O ficheiro enviado não contém texto legível/extraível.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Não foi possível extrair texto do documento. Verifique o ficheiro."
 *       500:
 *         description: Erro interno no servidor ou na integração com o motor de análise.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentoComparacaoErrorResponse'
 */


const createDocumentoComparacao = async (req, res, next) => {

    try {
        const body = req.body || {};
        const {
            titulo,
            autor,
            ano,
            curso_id,
            ativo,
            excluir_da_comparacao,
            motivo_exclusao,
            criado_por
        } = body;

        if (!titulo || !titulo.trim()) {
            return res.status(400).json({
                success: false,
                message: 'O título é obrigatório.'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum ficheiro recebido. Envie um PDF, DOC ou DOCX no campo ficheiro.'
            });
        }

        // Ler o ficheiro guardado pelo Multer
        const buffer = await fs.readFile(req.file.path);

        // Extrair o texto através do serviço Python
        const extraido = await extrairTexto(
            buffer,
            req.file.originalname
        );

        const textoExtraido = extraido.texto || '';

        if (!textoExtraido.trim()) {
            return res.status(422).json({
                success: false,
                message: 'Não foi possível extrair texto do documento. Verifique o ficheiro.'
            });
        }

        // Pré-processar o texto para comparação
        const processado = await preprocessarTexto(
            textoExtraido,
            { ignorar_secicoes: true }
        );

        const textoProcessado =
            processado.texto_processado || textoExtraido;
        console.log('Dados recebidos:', req.body);
        console.log('Ficheiro recebido:', req.file);
        // Guardar os metadados, o caminho e os textos
        const [resultado] = await pool.query(
            `INSERT INTO documentos_comparacao (
                titulo,
                autor,
                ano,
                curso_id,
                nome_ficheiro,
                caminho_ficheiro,
                texto_extraido,
                texto_processado,
                ativo,
                excluir_da_comparacao,
                motivo_exclusao,
                criado_por
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                titulo.trim(),
                autor || null,
                ano || null,
                curso_id || null,
                req.file.originalname,
                req.file.path,
                textoExtraido,
                textoProcessado,
                ativo !== undefined
                    ? (ativo === '1' || ativo === true ? 1 : 0)
                    : 1,
                excluir_da_comparacao === '1' ||
                    excluir_da_comparacao === true ? 1 : 0,
                motivo_exclusao || null,
                criado_por || null
            ]
        );

        const [documentos] = await pool.query(
            `SELECT id, titulo, autor, ano, curso_id,
                    nome_ficheiro, caminho_ficheiro,
                    LENGTH(texto_extraido) AS tamanho_extraido,
                    LENGTH(texto_processado) AS tamanho_processado,
                    ativo, excluir_da_comparacao
             FROM documentos_comparacao
             WHERE id = ?`,
            [resultado.insertId]
        );

        return res.status(201).json({
            success: true,
            message: 'Documento carregado e preparado para comparação.',
            data: documentos[0]
        });

    } catch (error) {
        console.error(
            'Erro ao cadastrar documento de comparação:',
            error.response?.data || error.message
        );

        next(error);
    }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateDocumentoComparacaoRequest:
 *       type: object
 *       properties:
 *         titulo:
 *           type: string
 *           example: "Estudo sobre Redes Neurais Avançadas"
 *         autor:
 *           type: string
 *           nullable: true
 *           example: "Carlos Alberto"
 *         ano:
 *           type: integer
 *           nullable: true
 *           example: 2026
 *         curso_id:
 *           type: integer
 *           nullable: true
 *           example: 3
 *         ativo:
 *           type: boolean
 *           description: "True/1 para activo, False/0 para inactivo"
 *           example: true
 *         excluir_da_comparacao:
 *           type: boolean
 *           description: "True/1 para excluir das análises, False/0 para incluir"
 *           example: false
 *         motivo_exclusao:
 *           type: string
 *           nullable: true
 *           example: "Documento obsoleto"
 *
 *     DocumentoComparacaoUpdatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Documento actualizado com sucesso."
 *         data:
 *           $ref: '#/components/schemas/DocumentoComparacao'
 */

/**
 * @swagger
 * /api/documentos-comparacao/{id}:
 *   put:
 *     summary: Actualizar documento de comparação
 *     description: Actualiza os metadados e configurações de um documento de comparação existente através do seu ID.
 *     tags: [DocumentosComparacao]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do documento de comparação.
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDocumentoComparacaoRequest'
 *     responses:
 *       200:
 *         description: Documento actualizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentoComparacaoUpdatedResponse'
 *       400:
 *         description: Nenhum campo enviado para actualização ou ID inválido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentoComparacaoErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Documento não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentoComparacaoErrorResponse'
 *
 *   delete:
 *     summary: Eliminar documento de comparação
 *     description: Remove permanentemente um documento de comparação da base de dados.
 *     tags: [DocumentosComparacao]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID do documento de comparação.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Documento eliminado com sucesso.
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
 *                   example: "Documento eliminado com sucesso."
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Documento não encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentoComparacaoErrorResponse'
 */

const updateDocumentoComparacao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { titulo, autor, ano, curso_id, ativo, excluir_da_comparacao, motivo_exclusao } = req.body;
        const [existente] = await pool.query(`SELECT id FROM documentos_comparacao WHERE id = ? LIMIT 1`, [id]);
        if (existente.length === 0) {
            return res.status(404).json({ success: false, message: 'Documento não encontrado.' });
        }
        const campos = [];
        const valores = [];
        if (titulo !== undefined) { campos.push('titulo = ?'); valores.push(titulo); }
        if (autor !== undefined) { campos.push('autor = ?'); valores.push(autor); }
        if (ano !== undefined) { campos.push('ano = ?'); valores.push(ano); }
        if (curso_id !== undefined) { campos.push('curso_id = ?'); valores.push(curso_id); }
        if (ativo !== undefined) { campos.push('ativo = ?'); valores.push(ativo === '1' || ativo === true ? 1 : 0); }
        if (excluir_da_comparacao !== undefined) { campos.push('excluir_da_comparacao = ?'); valores.push(excluir_da_comparacao === '1' || excluir_da_comparacao === true ? 1 : 0); }
        if (motivo_exclusao !== undefined) { campos.push('motivo_exclusao = ?'); valores.push(motivo_exclusao); }
        if (campos.length === 0) {
            return res.status(400).json({ success: false, message: 'Nenhum campo enviado para actualização.' });
        }
        valores.push(id);
        await pool.query(`UPDATE documentos_comparacao SET ${campos.join(', ')} WHERE id = ?`, valores);
        const [documento] = await pool.query(`SELECT * FROM documentos_comparacao WHERE id = ?`, [id]);
        return res.status(200).json({ success: true, message: 'Documento actualizado com sucesso.', data: documento[0] });
    } catch (error) { next(error); }
};

const deleteDocumentoComparacao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [existente] = await pool.query(`SELECT id FROM documentos_comparacao WHERE id = ? LIMIT 1`, [id]);
        if (existente.length === 0) {
            return res.status(404).json({ success: false, message: 'Documento não encontrado.' });
        }
        await pool.query(`DELETE FROM documentos_comparacao WHERE id = ?`, [id]);
        return res.status(200).json({ success: true, message: 'Documento eliminado com sucesso.' });
    } catch (error) { next(error); }
};

module.exports = {
    getDocumentosComparacao,
    getDocumentoComparacaoById,
    createDocumentoComparacao,
    updateDocumentoComparacao,
    deleteDocumentoComparacao
};
