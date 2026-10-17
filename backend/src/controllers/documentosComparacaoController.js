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
 * /api/documentos-comparacao:
 *   get:
 *     summary: Listar documentos de comparação
 *     tags: [DocumentosComparacao]
 *     security: - bearerAuth: []
 *   post:
 *     summary: Criar documento de comparação
 *     tags: [DocumentosComparacao]
 *     security: - bearerAuth: []
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
 *     tags: [DocumentosComparacao]
 *     security: - bearerAuth: []
 *   put:
 *     summary: Actualizar documento
 *     tags: [DocumentosComparacao]
 *     security: - bearerAuth: []
 *   delete:
 *     summary: Eliminar documento
 *     tags: [DocumentosComparacao]
 *     security: - bearerAuth: []
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

        // O ficheiro deve ser enviado no campo "ficheiro"
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
