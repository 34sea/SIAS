const pool = require('../config/db');
const {
    extrairTexto,
    preprocessarTexto,
    analisarSimilaridade,
    healthCheck
} = require('../services/pythonService');

/**
 * @swagger
 * tags:
 *   - name: Analises
 *     description: Motor de análise de similaridade e integração com Python
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     Analise:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         monografia_versao_id:
 *           type: integer
 *           example: 3
 *         iniciado_por:
 *           type: integer
 *           example: 1
 *         algoritmo:
 *           type: string
 *           example: "tfidf_cosine"
 *         versao_algoritmo:
 *           type: string
 *           example: "1.0.0"
 *         estado:
 *           type: string
 *           example: "CONCLUIDO"
 *         similaridade_geral:
 *           type: number
 *           format: float
 *           example: 15.4
 *         classificacao:
 *           type: string
 *           example: "BAIXA"
 *         data_inicio:
 *           type: string
 *           format: date-time
 *           example: "2026-09-18T08:30:00.000Z"
 *         data_conclusao:
 *           type: string
 *           format: date-time
 *           example: "2026-09-18T08:31:00.000Z"
 *         erro_mensagem:
 *           type: string
 *           nullable: true
 *           example: null
 *         criado_em:
 *           type: string
 *           format: date-time
 *           example: "2026-09-18T08:30:00.000Z"
 *         numero_versao:
 *           type: integer
 *           example: 1
 *         monografia_titulo:
 *           type: string
 *           example: "Sistema de Gestão Académica"
 *         estudante_nome:
 *           type: string
 *           example: "Dircia Domingos"
 *
 *     TrechoSemelhante:
 *       type: object
 *       properties:
 *         texto_documento_origem:
 *           type: string
 *           example: "Texto extraído da monografia..."
 *         texto_documento_comparado:
 *           type: string
 *           example: "Texto extraído do documento de referência..."
 *         pagina_origem:
 *           type: integer
 *           example: 12
 *         pagina_comparada:
 *           type: integer
 *           example: 5
 *         percentual_similaridade:
 *           type: number
 *           format: float
 *           example: 85.5
 *         metodo:
 *           type: string
 *           example: "cosine"
 *
 *     ResultadoComparacao:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         documento_id:
 *           type: integer
 *           example: 4
 *         percentual_similaridade:
 *           type: number
 *           format: float
 *           example: 15.4
 *         percentual_textual:
 *           type: number
 *           format: float
 *           example: 10.2
 *         percentual_semantico:
 *           type: number
 *           format: float
 *           example: 20.6
 *         quantidade_trechos:
 *           type: integer
 *           example: 3
 *         posicao_ranking:
 *           type: integer
 *           example: 1
 *         documento_titulo:
 *           type: string
 *           example: "Artigo Base sobre Plágio"
 *         documento_autor:
 *           type: string
 *           example: "João Silva"
 *         trechos:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TrechoSemelhante'
 *
 *     AnaliseDetalhada:
 *       allOf:
 *         - $ref: '#/components/schemas/Analise'
 *         - type: object
 *           properties:
 *             resultados:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ResultadoComparacao'
 *
 *     CreateAnaliseRequest:
 *       type: object
 *       required:
 *         - monografia_versao_id
 *       properties:
 *         monografia_versao_id:
 *           type: integer
 *           example: 3
 *         algoritmo:
 *           type: string
 *           example: "tfidf_cosine"
 *         texto_override:
 *           type: string
 *           example: "Texto opcional para análise directa..."
 *
 *     AnalisesResponse:
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
 *             $ref: '#/components/schemas/Analise'
 *
 *     AnaliseResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/AnaliseDetalhada'
 *
 *     AnaliseCreatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Análise iniciada/executada com sucesso."
 *         data:
 *           $ref: '#/components/schemas/Analise'
 *
 *     AnaliseErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Análise não encontrada."
 */

/**
 * @swagger
 * /api/analises:
 *   get:
 *     summary: Listar análises
 *     description: Retorna a lista de análises de similaridade realizadas, permitindo pesquisa por título ou nome do estudante, e filtragem por estado ou monografia.
 *     tags: [Analises]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Pesquisa por título da monografia ou nome completo do estudante.
 *         example: "Dircia"
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Filtra pelo estado da análise (ex. CONCLUIDO, PROCESSANDO, ERRO).
 *         example: "CONCLUIDO"
 *       - in: query
 *         name: monografia_id
 *         schema:
 *           type: integer
 *         description: Filtra as análises pelo ID da monografia.
 *         example: 1
 *     responses:
 *       200:
 *         description: Lista de análises obtida com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalisesResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *   post:
 *     summary: Executar análise de similaridade
 *     description: Inicia um novo processo de análise de similaridade para uma versão de monografia através do motor Python.
 *     tags: [Analises]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAnaliseRequest'
 *     responses:
 *       201:
 *         description: Análise executada ou iniciada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnaliseCreatedResponse'
 *       400:
 *         description: Dados inválidos ou parâmetros em falta.
 *       401:
 *         description: Não autenticado ou token inválido.
 */
// const getAnalises = async (req, res, next) => {
//     try {
//         const { search = '', estado, monografia_id } = req.query;
//         let sql = `
//             SELECT a.id, a.monografia_versao_id, a.iniciado_por, a.algoritmo,
//                    a.versao_algoritmo, a.estado, a.similaridade_geral,
//                    a.classificacao, a.data_inicio, a.data_conclusao,
//                    a.erro_mensagem, a.criado_em,
//                    mv.numero_versao, m.titulo AS monografia_titulo,
//                    u.nome_completo AS estudante_nome
//             FROM analises a
//             INNER JOIN monografia_versoes mv ON mv.id = a.monografia_versao_id
//             INNER JOIN monografias m ON m.id = mv.monografia_id
//             INNER JOIN estudantes e ON e.id = m.estudante_id
//             INNER JOIN utilizadores u ON u.id = e.utilizador_id
//             WHERE 1=1
//         `;
//         const params = [];
//         if (search.trim() !== '') {
//             sql += ` AND (m.titulo LIKE ? OR u.nome_completo LIKE ?)`;
//             const v = `%${search.trim()}%`;
//             params.push(v, v);
//         }
//         if (estado) { sql += ` AND a.estado = ?`; params.push(estado); }
//         if (monografia_id) { sql += ` AND m.id = ?`; params.push(monografia_id); }
//         sql += ` ORDER BY a.criado_em DESC`;
//         const [analises] = await pool.query(sql, params);
//         return res.status(200).json({ success: true, total: analises.length, data: analises });
//     } catch (error) { next(error); }
// };
const getAnalises = async (req, res, next) => {
    try {
        const { search = '', estado, monografia_id } = req.query;

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
                a.id,
                a.monografia_versao_id,
                a.iniciado_por,
                a.algoritmo,
                a.versao_algoritmo,
                a.estado,
                a.similaridade_geral,
                a.classificacao,
                a.data_inicio,
                a.data_conclusao,
                a.erro_mensagem,
                a.criado_em,
                mv.numero_versao,
                m.id AS monografia_id,
                m.titulo AS monografia_titulo,
                u.nome_completo AS estudante_nome
            FROM analises a
            INNER JOIN monografia_versoes mv
                ON mv.id = a.monografia_versao_id
            INNER JOIN monografias m
                ON m.id = mv.monografia_id
            INNER JOIN estudantes e
                ON e.id = m.estudante_id
            INNER JOIN utilizadores u
                ON u.id = e.utilizador_id
            WHERE 1 = 1
        `;

        const params = [];

        // Restringir resultados de acordo com o perfil
        if (role === 'ESTUDANTE') {
            sql += ` AND e.utilizador_id = ?`;
            params.push(utilizadorId);
        }

        if (role === 'DOCENTE') {
            sql += `
                AND EXISTS (
                    SELECT 1
                    FROM orientacoes o
                    INNER JOIN docentes d
                        ON d.id = o.docente_id
                    WHERE o.estudante_id = m.estudante_id
                      AND d.utilizador_id = ?
                      AND o.estado = 'ATIVA'
                )
            `;
            params.push(utilizadorId);
        }

        // Pesquisa por título da monografia ou nome do estudante
        if (
            typeof search === 'string' &&
            search.trim() !== ''
        ) {
            sql += `
                AND (
                    m.titulo LIKE ?
                    OR u.nome_completo LIKE ?
                )
            `;

            const valorPesquisa = `%${search.trim()}%`;
            params.push(valorPesquisa, valorPesquisa);
        }

        // Validar e filtrar pelo estado da análise
        if (estado !== undefined && String(estado).trim() !== '') {
            const estadosPermitidos = [
                'PENDENTE',
                'EM_PROCESSAMENTO',
                'CONCLUIDA',
                'ERRO'
            ];

            if (!estadosPermitidos.includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado da análise inválido.'
                });
            }

            sql += ` AND a.estado = ?`;
            params.push(estado);
        }

        // Validar e filtrar pelo ID da monografia
        if (
            monografia_id !== undefined &&
            String(monografia_id).trim() !== ''
        ) {
            const monografiaIdNumero = Number(monografia_id);

            if (
                !Number.isInteger(monografiaIdNumero) ||
                monografiaIdNumero <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'ID da monografia inválido.'
                });
            }

            sql += ` AND m.id = ?`;
            params.push(monografiaIdNumero);
        }

        sql += ` ORDER BY a.criado_em DESC`;

        const [analises] = await pool.query(sql, params);

        return res.status(200).json({
            success: true,
            total: analises.length,
            data: analises
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/analises/{id}:
 *   get:
 *     summary: Obter análise por ID
 *     description: Retorna os detalhes completos de uma análise específica, incluindo os resultados de comparação e os respetivos trechos semelhantes.
 *     tags: [Analises]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da análise.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Análise encontrada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnaliseResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Análise não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnaliseErrorResponse'
 */
const getAnaliseById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [analises] = await pool.query(
            `SELECT a.*, mv.numero_versao, m.titulo AS monografia_titulo,
                    u.nome_completo AS estudante_nome
             FROM analises a
             INNER JOIN monografia_versoes mv ON mv.id = a.monografia_versao_id
             INNER JOIN monografias m ON m.id = mv.monografia_id
             INNER JOIN estudantes e ON e.id = m.estudante_id
             INNER JOIN utilizadores u ON u.id = e.utilizador_id
             WHERE a.id = ? LIMIT 1`,
            [id]
        );
        if (analises.length === 0) {
            return res.status(404).json({ success: false, message: 'Análise não encontrada.' });
        }
        // Buscar resultados e trechos
        const [resultados] = await pool.query(
            `SELECT rc.id, rc.documento_id, rc.percentual_similaridade,
                    rc.percentual_textual, rc.percentual_semantico,
                    rc.quantidade_trechos, rc.posicao_ranking,
                    dc.titulo AS documento_titulo, dc.autor AS documento_autor
             FROM resultados_comparacao rc
             INNER JOIN documentos_comparacao dc ON dc.id = rc.documento_id
             WHERE rc.analise_id = ?
             ORDER BY rc.posicao_ranking ASC, rc.percentual_similaridade DESC`,
            [id]
        );
        for (const resultado of resultados) {
            const [trechos] = await pool.query(
                `SELECT texto_documento_origem, texto_documento_comparado,
                        pagina_origem, pagina_comparada, percentual_similaridade, metodo
                 FROM trechos_semelhantes
                 WHERE resultado_comparacao_id = ?
                 ORDER BY percentual_similaridade DESC LIMIT 10`,
                [resultado.id]
            );
            resultado.trechos = trechos;
        }
        analises[0].resultados = resultados;
        return res.status(200).json({ success: true, data: analises[0] });
    } catch (error) { next(error); }
};

/**
 * @swagger
 * /api/analises:
 *   post:
 *     summary: Executar e criar nova análise de similaridade
 *     description: Inicia e processa uma nova análise de similaridade para uma versão de monografia utilizando o motor Python.
 *     tags: [Analises]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAnaliseRequest'
 *     responses:
 *       201:
 *         description: Análise concluída com sucesso.
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
 *                   example: "Análise concluída com sucesso."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     similaridade_geral:
 *                       type: number
 *                       format: float
 *                       example: 15.4
 *                     classificacao:
 *                       type: string
 *                       example: "Baixa"
 *       400:
 *         description: A versão da monografia é obrigatória ou dados inválidos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnaliseErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Versão da monografia não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnaliseErrorResponse'
 *       502:
 *         description: Falha ao executar a análise no serviço Python.
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
 *                   example: "Falha ao executar a análise no serviço Python."
 *                 erro:
 *                   type: string
 *                   example: "Erro detalhado do Python..."
 *       503:
 *         description: Serviço de análise (Python) indisponível no momento.
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
 *                   example: "Serviço de análise (Python) indisponível no momento."
 */

const createAnalise = async (req, res, next) => {
    let connection;
    try {
        const { monografia_versao_id, iniciado_por, algoritmo, texto_override } = req.body;
        if (!monografia_versao_id) {
            return res.status(400).json({ success: false, message: 'A versão da monografia é obrigatória.' });
        }

        // Verificar se o serviço Python está disponível
        const pythonOk = await healthCheck();
        if (!pythonOk) {
            return res.status(503).json({
                success: false,
                message: 'Serviço de análise (Python) indisponível no momento.'
            });
        }

        const [versoes] = await pool.query(
            `SELECT mv.*, m.titulo, m.estudante_id
             FROM monografia_versoes mv
             INNER JOIN monografias m ON m.id = mv.monografia_id
             WHERE mv.id = ? LIMIT 1`,
            [monografia_versao_id]
        );
        if (versoes.length === 0) {
            return res.status(404).json({ success: false, message: 'Versão da monografia não encontrada.' });
        }
        const versao = versoes[0];

        // Criar registo da análise em estado AGUARDANDO
        const algoritmoNome = algoritmo || 'TF-IDF + Similaridade de Cosseno';
        const [resultado] = await pool.query(
            `INSERT INTO analises (monografia_versao_id, iniciado_por, algoritmo, estado)
             VALUES (?, ?, ?, 'AGUARDANDO')`,
            [monografia_versao_id, iniciado_por || null, algoritmoNome]
        );
        const analiseId = resultado.insertId;

        // Atualizar estado da versão para processada/em processamento
        await pool.query(
            `UPDATE monografia_versoes SET estado = 'PROCESSADA' WHERE id = ?`,
            [monografia_versao_id]
        );
        await pool.query(
            `UPDATE analises SET estado = 'PROCESSANDO', data_inicio = NOW() WHERE id = ?`,
            [analiseId]
        );

        // Obter texto da versão (extraído ou override)
        let textoOrigem = texto_override || versao.texto_processado || versao.texto_extraido || '';
        if (!textoOrigem) {
            // Tentar extrair do ficheiro via Python
            const fs = require('fs/promises');
            const path = require('path');
            const caminhoAbsoluto = path.resolve(process.cwd(), versao.caminho_ficheiro);
            try {
                const buffer = await fs.readFile(caminhoAbsoluto);
                const extraido = await extrairTexto(buffer, versao.nome_ficheiro);
                textoOrigem = extraido.texto || '';
            } catch (e) {
                textoOrigem = '';
            }
        }

        // Pré-processar texto origem via Python
        let textoOrigemProcessado = textoOrigem;
        try {
            const pre = await preprocessarTexto(textoOrigem, { ignorar_secicoes: true });
            textoOrigemProcessado = pre.texto_processado || textoOrigem;
        } catch (e) {
            // continua com texto cru
        }

        // Buscar documentos de comparação activos e não excluídos
        const [documentos] = await pool.query(
            `SELECT id, titulo, texto_extraido, texto_processado
             FROM documentos_comparacao
             WHERE ativo = TRUE AND excluir_da_comparacao = FALSE`
        );

        const documentosParaPython = documentos.map(d => ({
            id: d.id,
            texto: d.texto_processado || d.texto_extraido || ''
        })).filter(d => d.texto);

        // Buscar configuração activa
        const [configs] = await pool.query(
            `SELECT * FROM configuracoes_similaridade WHERE ativa = TRUE ORDER BY id DESC LIMIT 1`
        );
        const config = configs[0] || {};

        // Chamar Python para análise
        let analisePython;
        try {
            analisePython = await analisarSimilaridade({
                texto_origem: textoOrigemProcessado,
                documentos: documentosParaPython,
                config: {
                    similaridade_minima: config.similaridade_minima || 10,
                    limite_documentos: config.limite_documentos || 10,
                    ignorar_secicoes: config.ignorar_palavras_comuns !== false,
                }
            });
        } catch (e) {
            await pool.query(
                `UPDATE analises SET estado = 'ERRO', erro_mensagem = ?, data_conclusao = NOW() WHERE id = ?`,
                [`Erro no motor de análise: ${e.message}`, analiseId]
            );
            await pool.query(`UPDATE monografia_versoes SET estado = 'ERRO' WHERE id = ?`, [monografia_versao_id]);
            return res.status(502).json({
                success: false,
                message: 'Falha ao executar a análise no serviço Python.',
                erro: e.message
            });
        }

        // Guardar resultados
        const similaridadeGeral = analisePython.similaridade_geral || 0;
        const classificacao = analisePython.classificacao || 'Baixa';

        await pool.query(
            `UPDATE analises SET estado = 'CONCLUIDA', similaridade_geral = ?,
                    classificacao = ?, data_conclusao = NOW()
             WHERE id = ?`,
            [similaridadeGeral, classificacao, analiseId]
        );
        await pool.query(
            `UPDATE monografias SET estado = 'ANALISADA' WHERE id = (SELECT monografia_id FROM monografia_versoes WHERE id = ?)`,
            [monografia_versao_id]
        );
        await pool.query(
            `UPDATE monografia_versoes SET estado = 'PROCESSADA' WHERE id = ?`,
            [monografia_versao_id]
        );

        // Inserir resultados e trechos
        const analiseFinalId = analiseId;
        for (const r of (analisePython.resultados || []).slice(0, config.limite_documentos || 10)) {
            const [resResultado] = await pool.query(
                `INSERT INTO resultados_comparacao (analise_id, documento_id, percentual_similaridade,
                        quantidade_trechos, posicao_ranking)
                 VALUES (?, ?, ?, ?, ?)`,
                [analiseFinalId, r.documento_id, r.percentual_similaridade,
                    r.quantidade_trechos || 0, r.posicao_ranking || 0]
            );
            const resultadoId = resResultado.insertId;
            for (const t of (r.trechos || [])) {
                await pool.query(
                    `INSERT INTO trechos_semelhantes (resultado_comparacao_id, texto_documento_origem,
                            texto_documento_comparado, pagina_origem, pagina_comparada,
                            posicao_inicio_origem, posicao_fim_origem, percentual_similaridade, metodo)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        resultadoId,
                        t.texto || '',
                        t.texto || '',
                        t.pagina_origem || null,
                        t.pagina_comparada || null,
                        t.posicao_inicio || null,
                        t.posicao_fim || null,
                        r.percentual_similaridade || null,
                        'TF-IDF + Cosseno'
                    ]
                );
            }
        }

        // return res.status(201).json({
        //     success: true,
        //     message: 'Análise concluída com sucesso.',
        //     data: { id: analiseFinalId, similaridade_geral, classificacao }
        // });


        return res.status(201).json({
            success: true,
            message: 'Análise concluída com sucesso.',
            data: {
                id: analiseFinalId,
                similaridade_geral: similaridadeGeral,
                classificacao: classificacao
            }
        });

    } catch (error) {
        next(error);
    } finally {
        if (connection) connection.release();
    }
};

/**
 * @swagger
 * /api/analises/{id}/reanalisar:
 *   post:
 *     summary: Redefinir análise para reexecução
 *     description: Altera o estado de uma análise existente para 'AGUARDANDO' e limpa os campos de conclusão, permitindo que seja executada novamente.
 *     tags: [Analises]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da análise a ser redefinida.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Análise redefinida com sucesso.
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
 *                   example: "Análise redefinida para aguardando. Volte a executar."
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Análise não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnaliseErrorResponse'
 */

const reanalisarAnalise = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [existente] = await pool.query(`SELECT id FROM analises WHERE id = ? LIMIT 1`, [id]);
        if (existente.length === 0) {
            return res.status(404).json({ success: false, message: 'Análise não encontrada.' });
        }
        await pool.query(
            `UPDATE analises SET estado = 'AGUARDANDO', erro_mensagem = NULL,
                    data_conclusao = NULL, similaridade_geral = NULL WHERE id = ?`,
            [id]
        );
        return res.status(200).json({ success: true, message: 'Análise redefinida para aguardando. Volte a executar.' });
    } catch (error) { next(error); }
};

module.exports = { getAnalises, getAnaliseById, createAnalise, reanalisarAnalise };
