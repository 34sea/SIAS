const pool = require('../config/db');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
/**
 * @swagger
 * tags:
 *   - name: Monografias
 *     description: Submissão e gestão de monografias e versões
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Monografia:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         estudante_id:
 *           type: integer
 *           example: 2
 *         estudante_nome:
 *           type: string
 *           example: "Martinho Domingos"
 *         orientador_id:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         orientador_nome:
 *           type: string
 *           nullable: true
 *           example: "Dr. João Silva"
 *         titulo:
 *           type: string
 *           example: "Sistema de Gestão Académica"
 *         ano:
 *           type: integer
 *           example: 2026
 *         descricao:
 *           type: string
 *           nullable: true
 *           example: "Monografia focada em arquitetura de microsserviços."
 *         estado:
 *           type: string
 *           enum:
 *             - SUBMETIDA
 *             - AGUARDANDO_ANALISE
 *             - EM_ANALISE
 *             - ANALISADA
 *             - RELATORIO_DISPONIVEL
 *             - ERRO_PROCESSAMENTO
 *             - ARQUIVADA
 *           example: "SUBMETIDA"
 *         versao_atual:
 *           type: integer
 *           example: 1
 *         participa_comparacao:
 *           type: boolean
 *           example: true
 *         criado_em:
 *           type: string
 *           format: date-time
 *           example: "2026-10-18T08:30:00.000Z"
 *         atualizado_em:
 *           type: string
 *           format: date-time
 *           example: "2026-10-18T09:30:00.000Z"
 *
 *     MonografiaVersao:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         monografia_id:
 *           type: integer
 *           example: 1
 *         numero_versao:
 *           type: integer
 *           example: 1
 *         nome_ficheiro:
 *           type: string
 *           example: "monografia-1712345678.pdf"
 *         nome_original:
 *           type: string
 *           example: "Monografia_Final.pdf"
 *         caminho_ficheiro:
 *           type: string
 *           example: "uploads/monografias/monografia-1712345678.pdf"
 *         extensao:
 *           type: string
 *           example: "pdf"
 *         mime_type:
 *           type: string
 *           example: "application/pdf"
 *         tamanho_bytes:
 *           type: integer
 *           example: 2048576
 *         hash_sha256:
 *           type: string
 *           example: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
 *         estado:
 *           type: string
 *           enum: [SUBMETIDA, TEXTO_EXTRAIDO, PROCESSADA, ERRO]
 *           example: "SUBMETIDA"
 *         submetido_por:
 *           type: integer
 *           example: 2
 *         criado_em:
 *           type: string
 *           format: date-time
 *           example: "2026-10-18T08:30:00.000Z"
 *
 *     MonografiasResponse:
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
 *             $ref: '#/components/schemas/Monografia'
 *
 *     MonografiaResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/Monografia'
 *
 *     MonografiaCreatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Monografia submetida com sucesso."
 *         data:
 *           $ref: '#/components/schemas/Monografia'
 *         versao:
 *           $ref: '#/components/schemas/MonografiaVersao'
 *
 *     MonografiaErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Monografia não encontrada."
 */

/**
 * Remove um ficheiro do disco.
 */
const removerFicheiro = async (ficheiro) => {
    if (!ficheiro) return;

    try {
        await fs.unlink(ficheiro);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error(
                'Erro ao remover ficheiro:',
                error.message
            );
        }
    }
};

/**
 * Calcula o hash SHA-256 de um ficheiro.
 */
const calcularHash = async (caminho) => {
    const hash = crypto.createHash('sha256');
    const conteudo = await fs.readFile(caminho);

    return hash.update(conteudo).digest('hex');
};

/**
 * Obtém os dados de uma monografia com o estudante e orientador.
 */
const obterMonografia = async (id, executor = pool) => {
    const [rows] = await executor.query(
        `
        SELECT
            m.id,
            m.estudante_id,
            ue.nome_completo AS estudante_nome,
            m.orientador_id,
            ud.nome_completo AS orientador_nome,
            m.titulo,
            m.ano,
            m.descricao,
            m.estado,
            m.versao_atual,
            m.participa_comparacao,
            m.criado_em,
            m.atualizado_em
        FROM monografias m
        INNER JOIN estudantes e
            ON e.id = m.estudante_id
        INNER JOIN utilizadores ue
            ON ue.id = e.utilizador_id
        LEFT JOIN docentes d
            ON d.id = m.orientador_id
        LEFT JOIN utilizadores ud
            ON ud.id = d.utilizador_id
        WHERE m.id = ?
        LIMIT 1
        `,
        [id]
    );

    return rows[0] || null;
};

/**
 * @swagger
 * /api/monografias:
 *   get:
 *     summary: Listar monografias
 *     description: Retorna a lista de monografias registadas, permitindo filtragem opcional por pesquisa textual, estado, estudante, orientador, curso ou ano.
 *     tags: [Monografias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Pesquisa por título da monografia ou nome completo do estudante.
 *         example: "Sistema"
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [SUBMETIDA, AGUARDANDO_ANALISE, EM_ANALISE, ANALISADA, RELATORIO_DISPONIVEL, ERRO_PROCESSAMENTO, ARQUIVADA]
 *         description: Filtra pelo estado da monografia.
 *         example: "SUBMETIDA"
 *       - in: query
 *         name: estudante_id
 *         schema:
 *           type: integer
 *         description: Filtra pelo ID do estudante.
 *         example: 2
 *       - in: query
 *         name: orientador_id
 *         schema:
 *           type: integer
 *         description: Filtra pelo ID do docente orientador.
 *         example: 1
 *       - in: query
 *         name: curso_id
 *         schema:
 *           type: integer
 *         description: Filtra pelo ID do curso do estudante.
 *         example: 3
 *       - in: query
 *         name: ano
 *         schema:
 *           type: integer
 *         description: Filtra pelo ano da monografia.
 *         example: 2026
 *     responses:
 *       200:
 *         description: Lista de monografias obtida com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonografiasResponse'
 *       400:
 *         description: Parâmetro de filtro inválido (estado, IDs ou ano incorretos).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonografiaErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 */
const obterVersao = async (monografiaId, versaoId) => {
    const [rows] = await pool.query(
        `
        SELECT
            id,
            monografia_id,
            numero_versao,
            nome_ficheiro,
            nome_original,
            caminho_ficheiro,
            extensao,
            mime_type,
            tamanho_bytes,
            hash_sha256,
            estado,
            submetido_por,
            criado_em
        FROM monografia_versoes
        WHERE monografia_id = ?
          AND id = ?
        LIMIT 1
        `,
        [monografiaId, versaoId]
    );

    return rows[0] || null;
};

/**
 * Lista monografias com filtros opcionais.
 */

const getMonografias = async (req, res, next) => {
    try {
        const {
            search = '',
            estado,
            estudante_id,
            orientador_id,
            curso_id,
            ano
        } = req.query;

        // O middleware de autenticação deve validar o JWT
        // e preencher req.user.
        const utilizadorId = Number(req.user?.id);
        const role = String(
            req.user?.role_nome ?? req.user?.role ?? ''
        ).toUpperCase();

        if (
            !Number.isInteger(utilizadorId) ||
            utilizadorId <= 0 ||
            !['ADMIN', 'ESTUDANTE', 'DOCENTE'].includes(role)
        ) {
            return res.status(403).json({
                success: false,
                message: 'Utilizador não autorizado.'
            });
        }

        let sql = `
            SELECT
                m.id,
                m.estudante_id,
                e.utilizador_id AS estudante_utilizador_id,
                ue.nome_completo AS estudante_nome,
                m.orientador_id,
                d.utilizador_id AS orientador_utilizador_id,
                ud.nome_completo AS orientador_nome,
                m.titulo,
                m.ano,
                m.descricao,
                m.estado,
                m.versao_atual,
                m.participa_comparacao,
                m.criado_em,
                m.atualizado_em
            FROM monografias m
            INNER JOIN estudantes e
                ON e.id = m.estudante_id
            INNER JOIN utilizadores ue
                ON ue.id = e.utilizador_id
            LEFT JOIN docentes d
                ON d.id = m.orientador_id
            LEFT JOIN utilizadores ud
                ON ud.id = d.utilizador_id
            WHERE 1 = 1
        `;

        const params = [];

        // ==========================================
        // 1. RESTRIÇÃO OBRIGATÓRIA POR ROLE
        // ==========================================

        if (role === 'ESTUDANTE') {
            // O estudante só pode consultar as suas monografias.
            sql += `
                AND e.utilizador_id = ?
            `;

            params.push(utilizadorId);
        }

        if (role === 'DOCENTE') {
            // O docente só pode consultar monografias
            // de estudantes que orienta.
            sql += `
                AND EXISTS (
                    SELECT 1
                    FROM orientacoes o
                    INNER JOIN docentes od
                        ON od.id = o.docente_id
                    WHERE o.estudante_id = m.estudante_id
                      AND od.utilizador_id = ?
                      AND o.estado = 'ATIVA'
                )
            `;

            params.push(utilizadorId);
        }

        // ADMIN não recebe restrição adicional:
        // pode consultar todas as monografias.

        // ==========================================
        // 2. PESQUISA POR TÍTULO OU ESTUDANTE
        // ==========================================

        if (String(search).trim()) {
            sql += `
                AND (
                    m.titulo LIKE ?
                    OR ue.nome_completo LIKE ?
                )
            `;

            const valor = `%${String(search).trim()}%`;
            params.push(valor, valor);
        }

        // ==========================================
        // 3. FILTRO POR ESTADO
        // ==========================================

        if (estado !== undefined && String(estado).trim()) {
            const estadosPermitidos = [
                'SUBMETIDA',
                'AGUARDANDO_ANALISE',
                'EM_ANALISE',
                'ANALISADA',
                'RELATORIO_DISPONIVEL',
                'ERRO_PROCESSAMENTO',
                'ARQUIVADA'
            ];

            if (!estadosPermitidos.includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado da monografia inválido.'
                });
            }

            sql += ' AND m.estado = ?';
            params.push(estado);
        }

        // ==========================================
        // 4. FILTROS NUMÉRICOS
        // ==========================================

        const filtrosNumericos = [
            {
                campo: estudante_id,
                coluna: 'm.estudante_id',
                mensagem: 'ID do estudante inválido.'
            },
            {
                campo: orientador_id,
                coluna: 'm.orientador_id',
                mensagem: 'ID do orientador inválido.'
            },
            {
                campo: curso_id,
                coluna: 'e.curso_id',
                mensagem: 'ID do curso inválido.'
            }
        ];

        for (const filtro of filtrosNumericos) {
            if (
                filtro.campo === undefined ||
                filtro.campo === ''
            ) {
                continue;
            }

            const valor = Number(filtro.campo);

            if (!Number.isInteger(valor) || valor <= 0) {
                return res.status(400).json({
                    success: false,
                    message: filtro.mensagem
                });
            }

            sql += ` AND ${filtro.coluna} = ?`;
            params.push(valor);
        }

        // ==========================================
        // 5. FILTRO POR ANO
        // ==========================================

        if (ano !== undefined && String(ano).trim() !== '') {
            const anoNumero = Number(ano);

            if (
                !Number.isInteger(anoNumero) ||
                anoNumero < 1901 ||
                anoNumero > 2155
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Ano inválido.'
                });
            }

            sql += ' AND m.ano = ?';
            params.push(anoNumero);
        }

        // ==========================================
        // 6. ORDENAÇÃO E EXECUÇÃO
        // ==========================================

        sql += ' ORDER BY m.criado_em DESC';

        const [monografias] = await pool.query(sql, params);

        return res.status(200).json({
            success: true,
            total: monografias.length,
            data: monografias
        });
    } catch (error) {
        next(error);
    }
};
/**
 * @swagger
 * components:
 *   schemas:
 *     MonografiaComVersoes:
 *       allOf:
 *         - $ref: '#/components/schemas/Monografia'
 *         - type: object
 *           properties:
 *             versoes:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MonografiaVersao'
 *
 *     MonografiaDetalhadaResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/MonografiaComVersoes'
 */

/**
 * @swagger
 * /api/monografias/{id}:
 *   get:
 *     summary: Obter monografia por ID
 *     description: Retorna os detalhes completos de uma monografia específica, incluindo a lista de todas as suas versões associadas ordenadas da mais recente para a mais antiga.
 *     tags: [Monografias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da monografia.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Monografia encontrada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonografiaDetalhadaResponse'
 *       400:
 *         description: ID da monografia inválido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonografiaErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Monografia não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonografiaErrorResponse'
 */
/**
 * Consulta uma monografia pelo ID, incluindo as versões.
 */
const getMonografiaById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID da monografia inválido.'
            });
        }

        const monografia = await obterMonografia(id);

        if (!monografia) {
            return res.status(404).json({
                success: false,
                message: 'Monografia não encontrada.'
            });
        }

        const [versoes] = await pool.query(
            `
            SELECT
                id,
                monografia_id,
                numero_versao,
                nome_original,
                extensao,
                mime_type,
                tamanho_bytes,
                hash_sha256,
                estado,
                submetido_por,
                criado_em
            FROM monografia_versoes
            WHERE monografia_id = ?
            ORDER BY numero_versao DESC
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            data: {
                ...monografia,
                versoes
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateMonografiaRequest:
 *       type: object
 *       required:
 *         - titulo
 *         - ano
 *         - estudante_id
 *         - ficheiro
 *       properties:
 *         titulo:
 *           type: string
 *           maxLength: 500
 *           example: "Sistema de Gestão Académica"
 *         ano:
 *           type: integer
 *           example: 2026
 *         descricao:
 *           type: string
 *           nullable: true
 *           example: "Monografia focada em arquitetura de microsserviços."
 *         estudante_id:
 *           type: integer
 *           example: 2
 *         orientador_id:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         ficheiro:
 *           type: string
 *           format: binary
 *           description: Ficheiro da monografia (PDF, etc.)
 */

/**
 * @swagger
 * /api/monografias:
 *   post:
 *     summary: Submeter nova monografia
 *     description: Submete uma nova monografia com upload opcional de ficheiro, criando a primeira versão e a monografia dentro de uma transação.
 *     tags: [Monografias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreateMonografiaRequest'
 *     responses:
 *       201:
 *         description: Monografia submetida com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonografiaCreatedResponse'
 *       400:
 *         description: Dados inválidos, campos obrigatórios em falta ou ficheiro não enviado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonografiaErrorResponse'
 *       401:
 *         description: Não autenticado, token inválido ou utilizador inativo.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonografiaErrorResponse'
 *       403:
 *         description: O estudante não tem permissão para submeter em nome de outro.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonografiaErrorResponse'
 */
/**
 * Submete uma nova monografia e cria a primeira versão numa transacção.
 */

const createMonografia = async (req, res, next) => {
    let connection;
    let transacaoIniciada = false;
    let guardarFicheiro = false;

    try {
        const {
            titulo,
            ano,
            descricao,
            estudante_id,
            orientador_id
        } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'O ficheiro da monografia é obrigatório.'
            });
        }

        // ID da conta autenticada, não o ID do estudante.
        const utilizadorId = Number(req.user?.id);

        if (!Number.isInteger(utilizadorId) || utilizadorId <= 0) {
            return res.status(401).json({
                success: false,
                message: 'Utilizador não autenticado ou ID inválido.'
            });
        }

        const tituloLimpo = String(titulo || '').trim();
        const anoNumero = Number(ano);
        const estudanteId = Number(estudante_id);

        if (!tituloLimpo || tituloLimpo.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'O título é obrigatório e não pode exceder 500 caracteres.'
            });
        }

        if (
            !Number.isInteger(anoNumero) ||
            anoNumero < 1901 ||
            anoNumero > 2155
        ) {
            return res.status(400).json({
                success: false,
                message: 'O ano da monografia é inválido.'
            });
        }

        if (!Number.isInteger(estudanteId) || estudanteId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID do estudante inválido.'
            });
        }

        let orientadorId = null;

        if (
            orientador_id !== undefined &&
            orientador_id !== null &&
            String(orientador_id).trim() !== ''
        ) {
            orientadorId = Number(orientador_id);

            if (
                !Number.isInteger(orientadorId) ||
                orientadorId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do orientador inválido.'
                });
            }
        }

        connection = await pool.getConnection();

        await connection.beginTransaction();
        transacaoIniciada = true;

        // 1. Confirmar que a conta existe e está ativa.
        const [utilizadores] = await connection.query(
            `
            SELECT u.id, r.nome AS role
            FROM utilizadores u
            INNER JOIN roles r ON r.id = u.role_id
            WHERE u.id = ?
              AND u.ativo = TRUE
            LIMIT 1
            `,
            [utilizadorId]
        );

        if (utilizadores.length === 0) {
            await connection.rollback();
            transacaoIniciada = false;

            return res.status(401).json({
                success: false,
                message: 'Utilizador inexistente ou inativo.'
            });
        }

        // 2. Confirmar que o estudante existe e está ativo.
        const [estudantes] = await connection.query(
            `
            SELECT id, utilizador_id, curso_id
            FROM estudantes
            WHERE id = ?
              AND ativo = TRUE
            LIMIT 1
            `,
            [estudanteId]
        );

        if (estudantes.length === 0) {
            await connection.rollback();
            transacaoIniciada = false;

            return res.status(400).json({
                success: false,
                message: 'Estudante inexistente ou inativo.'
            });
        }

        const estudante = estudantes[0];
        const utilizador = utilizadores[0];

        // 3. Impedir que um estudante submeta em nome de outro.
        if (
            utilizador.role === 'ESTUDANTE' &&
            Number(estudante.utilizador_id) !== utilizadorId
        ) {
            await connection.rollback();
            transacaoIniciada = false;

            return res.status(403).json({
                success: false,
                message: 'Não podes submeter uma monografia em nome de outro estudante.'
            });
        }

        // 4. Validar o orientador.
        if (orientadorId !== null) {
            const [orientadores] = await connection.query(
                `
                SELECT id
                FROM docentes
                WHERE id = ?
                  AND ativo = TRUE
                LIMIT 1
                `,
                [orientadorId]
            );

            if (orientadores.length === 0) {
                await connection.rollback();
                transacaoIniciada = false;

                return res.status(400).json({
                    success: false,
                    message: 'Orientador inexistente ou inativo.'
                });
            }
        }

        // 5. Calcular o hash e preparar o caminho do ficheiro.
        const caminhoRelativo = path.posix.join(
            'uploads',
            'monografias',
            req.file.filename
        );

        const hash = await calcularHash(req.file.path);

        // 6. Criar a monografia.
        const [resultado] = await connection.query(
            `
            INSERT INTO monografias (
                estudante_id,
                orientador_id,
                titulo,
                ano,
                descricao,
                estado,
                versao_atual,
                participa_comparacao
            )
            VALUES (?, ?, ?, ?, ?, 'SUBMETIDA', 1, TRUE)
            `,
            [
                estudanteId,
                orientadorId,
                tituloLimpo,
                anoNumero,
                descricao ? String(descricao).trim() : null
            ]
        );

        const monografiaId = resultado.insertId;

        // 7. Criar a primeira versão.
        // submetido_por referencia utilizadores.id.
        const [versaoResultado] = await connection.query(
            `
            INSERT INTO monografia_versoes (
                monografia_id,
                numero_versao,
                nome_ficheiro,
                nome_original,
                caminho_ficheiro,
                extensao,
                mime_type,
                tamanho_bytes,
                hash_sha256,
                estado,
                submetido_por
            )
            VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, 'SUBMETIDA', ?)
            `,
            [
                monografiaId,
                req.file.filename,
                req.file.originalname,
                caminhoRelativo,
                path.extname(req.file.originalname).toLowerCase(),
                req.file.mimetype,
                req.file.size,
                hash,
                utilizadorId
            ]
        );

        // 8. Obter os registos antes de concluir a transação.
        const monografia = await obterMonografia(
            monografiaId,
            connection
        );

        const [versoes] = await connection.query(
            `
            SELECT
                id,
                monografia_id,
                numero_versao,
                nome_ficheiro,
                nome_original,
                caminho_ficheiro,
                extensao,
                mime_type,
                tamanho_bytes,
                hash_sha256,
                estado,
                submetido_por,
                criado_em
            FROM monografia_versoes
            WHERE id = ?
            LIMIT 1
            `,
            [versaoResultado.insertId]
        );

        // 9. Confirmar ambas as inserções.
        await connection.commit();
        transacaoIniciada = false;
        guardarFicheiro = true;

        return res.status(201).json({
            success: true,
            message: 'Monografia submetida com sucesso.',
            data: monografia,
            versao: versoes[0]
        });

    } catch (error) {
        if (connection && transacaoIniciada) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    'Erro ao reverter transação:',
                    rollbackError.message
                );
            }
        }

        return next(error);

    } finally {
        if (connection) {
            connection.release();
        }

        if (req.file && !guardarFicheiro) {
            await removerFicheiro(req.file.path);
        }
    }
};
/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateMonografiaRequest:
 *       type: object
 *       properties:
 *         titulo:
 *           type: string
 *           maxLength: 500
 *           example: "Sistema de Gestão Académica Avançado"
 *         ano:
 *           type: integer
 *           example: 2026
 *         descricao:
 *           type: string
 *           nullable: true
 *           example: "Monografia actualizada com novos módulos de microsserviços."
 *         orientador_id:
 *           type: integer
 *           nullable: true
 *           example: 2
 *
 *     MonografiaUpdatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Monografia atualizada com sucesso."
 *         data:
 *           $ref: '#/components/schemas/Monografia'
 */

/**
 * @swagger
 * /api/monografias/{id}:
 *   put:
 *     summary: Actualizar metadados da monografia
 *     description: Actualiza os dados gerais (título, ano, descrição ou orientador) de uma monografia existente sem alterar o documento físico anexado. Não é permitido editar monografias arquivadas.
 *     tags: [Monografias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da monografia.
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMonografiaRequest'
 *     responses:
 *       200:
 *         description: Monografia actualizada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonografiaUpdatedResponse'
 *       400:
 *         description: ID inválido, campos incorretos, monografia arquivada ou orientador inexistente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonografiaErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Monografia não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonografiaErrorResponse'
 */
/**
 * Actualiza os metadados da monografia sem substituir o documento.
 */
const updateMonografia = async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID da monografia inválido.'
            });
        }

        const monografia = await obterMonografia(id);

        if (!monografia) {
            return res.status(404).json({
                success: false,
                message: 'Monografia não encontrada.'
            });
        }

        if (monografia.estado === 'ARQUIVADA') {
            return res.status(400).json({
                success: false,
                message: 'Não é possível editar uma monografia arquivada.'
            });
        }

        const {
            titulo,
            ano,
            descricao,
            orientador_id
        } = req.body;

        const campos = [];
        const params = [];

        if (titulo !== undefined) {
            const valor = String(titulo).trim();

            if (!valor || valor.length > 500) {
                return res.status(400).json({
                    success: false,
                    message: 'Título inválido.'
                });
            }

            campos.push('titulo = ?');
            params.push(valor);
        }

        if (ano !== undefined) {
            const valor = Number(ano);

            if (
                !Number.isInteger(valor) ||
                valor < 1901 ||
                valor > 2155
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Ano inválido.'
                });
            }

            campos.push('ano = ?');
            params.push(valor);
        }

        if (descricao !== undefined) {
            campos.push('descricao = ?');
            params.push(
                descricao === null ? null : String(descricao).trim()
            );
        }

        if (orientador_id !== undefined) {
            let valor = null;

            if (
                orientador_id !== null &&
                String(orientador_id).trim() !== ''
            ) {
                valor = Number(orientador_id);

                if (!Number.isInteger(valor) || valor <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'ID do orientador inválido.'
                    });
                }

                const [orientadores] = await pool.query(
                    `
                    SELECT id
                    FROM docentes
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [valor]
                );

                if (orientadores.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Orientador inexistente.'
                    });
                }
            }

            campos.push('orientador_id = ?');
            params.push(valor);
        }

        if (campos.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum campo válido foi enviado para atualização.'
            });
        }

        params.push(id);

        await pool.query(
            `UPDATE monografias SET ${campos.join(', ')} WHERE id = ?`,
            params
        );

        const atualizada = await obterMonografia(id);

        return res.status(200).json({
            success: true,
            message: 'Monografia atualizada com sucesso.',
            data: atualizada
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * components:
 *   schemas:
 *     MonografiaVersoesResponse:
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
 *             $ref: '#/components/schemas/MonografiaVersao'
 *
 *     MonografiaVersaoResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/MonografiaVersao'
 */

/**
 * @swagger
 * /api/monografias/{id}/versoes:
 *   get:
 *     summary: Listar versões de uma monografia
 *     description: Retorna todas as versões associadas a uma monografia específica, ordenadas da mais recente para a mais antiga.
 *     tags: [Monografias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da monografia.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Lista de versões obtida com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonografiaVersoesResponse'
 *       400:
 *         description: ID da monografia inválido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonografiaErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Monografia não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonografiaErrorResponse'
 *
 * /api/monografias/{id}/versoes/{versaoId}:
 *   get:
 *     summary: Consultar versão específica de uma monografia
 *     description: Retorna os dados detalhados de uma versão específica pertencente a uma monografia.
 *     tags: [Monografias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da monografia.
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: versaoId
 *         required: true
 *         description: ID da versão da monografia.
 *         schema:
 *           type: integer
 *         example: 2
 *     responses:
 *       200:
 *         description: Versão encontrada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonografiaVersaoResponse'
 *       400:
 *         description: ID da monografia ou da versão inválido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonografiaErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Monografia ou versão não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonografiaErrorResponse'
 */
/**
 * Lista todas as versões de uma monografia.
 */
const getMonografiaVersoes = async (req, res, next) => {
    try {
        const monografiaId = Number(req.params.id);

        if (!Number.isInteger(monografiaId) || monografiaId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID da monografia inválido.'
            });
        }

        const monografia = await obterMonografia(monografiaId);

        if (!monografia) {
            return res.status(404).json({
                success: false,
                message: 'Monografia não encontrada.'
            });
        }

        const [versoes] = await pool.query(
            `
            SELECT
                id,
                monografia_id,
                numero_versao,
                nome_ficheiro,
                nome_original,
                extensao,
                mime_type,
                tamanho_bytes,
                hash_sha256,
                estado,
                submetido_por,
                criado_em
            FROM monografia_versoes
            WHERE monografia_id = ?
            ORDER BY numero_versao DESC
            `,
            [monografiaId]
        );

        return res.status(200).json({
            success: true,
            total: versoes.length,
            data: versoes
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Consulta uma versão específica de uma monografia.
 */
const getMonografiaVersaoById = async (req, res, next) => {
    try {
        const monografiaId = Number(req.params.id);
        const versaoId = Number(req.params.versaoId);

        if (
            !Number.isInteger(monografiaId) || monografiaId <= 0 ||
            !Number.isInteger(versaoId) || versaoId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'ID da monografia ou da versão inválido.'
            });
        }

        const monografia = await obterMonografia(monografiaId);

        if (!monografia) {
            return res.status(404).json({
                success: false,
                message: 'Monografia não encontrada.'
            });
        }

        const versao = await obterVersao(monografiaId, versaoId);

        if (!versao) {
            return res.status(404).json({
                success: false,
                message: 'Versão não encontrada.'
            });
        }

        return res.status(200).json({
            success: true,
            data: versao
        });
    } catch (error) {
        next(error);
    }
};
/**
 * @swagger
 * components:
 *   schemas:
 *     CreateMonografiaVersaoRequest:
 *       type: object
 *       required:
 *         - submetido_por
 *         - ficheiro
 *       properties:
 *         submetido_por:
 *           type: integer
 *           description: ID do utilizador que está a submeter a nova versão.
 *           example: 2
 *         ficheiro:
 *           type: string
 *           format: binary
 *           description: Ficheiro da nova versão da monografia (PDF, etc.).
 *
 *     MonografiaVersaoCreatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Nova versão submetida com sucesso."
 *         data:
 *           $ref: '#/components/schemas/MonografiaVersao'
 */

/**
 * @swagger
 * /api/monografias/{id}/versoes:
 *   post:
 *     summary: Submeter nova versão de uma monografia
 *     description: Submete um novo ficheiro para criar a próxima versão de uma monografia existente, actualizando a versão actual e o estado da monografia dentro de uma transação.
 *     tags: [Monografias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da monografia.
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreateMonografiaVersaoRequest'
 *     responses:
 *       201:
 *         description: Nova versão submetida com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonografiaVersaoCreatedResponse'
 *       400:
 *         description: ID da monografia/utilizador inválido, ficheiro não enviado ou monografia arquivada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonografiaErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Monografia não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonografiaErrorResponse'
 */
/**
 * Submete uma nova versão e preserva o histórico anterior.
 */
const createMonografiaVersao = async (req, res, next) => {
    let connection;
    let transacaoIniciada = false;
    let guardarFicheiro = false;

    try {
        const monografiaId = Number(req.params.id);

        if (!Number.isInteger(monografiaId) || monografiaId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID da monografia inválido.'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'O ficheiro da nova versão é obrigatório.'
            });
        }

        // O ID do utilizador é recebido no corpo do pedido.
        const submetidoPor = Number(req.body.submetido_por);

        if (!Number.isInteger(submetidoPor) || submetidoPor <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID do utilizador que submete a versão inválido.'
            });
        }

        const caminhoRelativo = path.posix.join(
            'uploads',
            'monografias',
            req.file.filename
        );

        const hash = await calcularHash(req.file.path);

        connection = await pool.getConnection();
        await connection.beginTransaction();
        transacaoIniciada = true;

        // Bloqueia a monografia para evitar números de versão duplicados.
        const [monografias] = await connection.query(
            `
            SELECT id, estado, versao_atual
            FROM monografias
            WHERE id = ?
            FOR UPDATE
            `,
            [monografiaId]
        );

        if (monografias.length === 0) {
            await connection.rollback();
            transacaoIniciada = false;

            return res.status(404).json({
                success: false,
                message: 'Monografia não encontrada.'
            });
        }

        const monografia = monografias[0];

        if (monografia.estado === 'ARQUIVADA') {
            await connection.rollback();
            transacaoIniciada = false;

            return res.status(400).json({
                success: false,
                message: 'Não é possível criar versões de uma monografia arquivada.'
            });
        }

        const numeroVersao = Number(monografia.versao_atual) + 1;

        const [resultado] = await connection.query(
            `
            INSERT INTO monografia_versoes (
                monografia_id,
                numero_versao,
                nome_ficheiro,
                nome_original,
                caminho_ficheiro,
                extensao,
                mime_type,
                tamanho_bytes,
                hash_sha256,
                estado,
                submetido_por
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMETIDA', ?)
            `,
            [
                monografiaId,
                numeroVersao,
                req.file.filename,
                req.file.originalname,
                caminhoRelativo,
                path.extname(req.file.originalname).toLowerCase(),
                req.file.mimetype,
                req.file.size,
                hash,
                submetidoPor
            ]
        );

        await connection.query(
            `
            UPDATE monografias
            SET versao_atual = ?,
                estado = 'SUBMETIDA'
            WHERE id = ?
            `,
            [numeroVersao, monografiaId]
        );

        const [versoes] = await connection.query(
            `
            SELECT
                id,
                monografia_id,
                numero_versao,
                nome_ficheiro,
                nome_original,
                caminho_ficheiro,
                extensao,
                mime_type,
                tamanho_bytes,
                hash_sha256,
                estado,
                submetido_por,
                criado_em
            FROM monografia_versoes
            WHERE id = ?
            LIMIT 1
            `,
            [resultado.insertId]
        );

        await connection.commit();
        transacaoIniciada = false;
        guardarFicheiro = true;

        return res.status(201).json({
            success: true,
            message: 'Nova versão submetida com sucesso.',
            data: versoes[0]
        });
    } catch (error) {
        if (connection && transacaoIniciada) {
            await connection.rollback();
        }

        next(error);
    } finally {
        if (connection) connection.release();

        if (req.file && !guardarFicheiro) {
            await removerFicheiro(req.file.path);
        }
    }
};
/**
 * @swagger
 * /api/monografias/{id}:
 *   delete:
 *     summary: Arquivar monografia
 *     description: Altera o estado da monografia para 'ARQUIVADA' sem apagar o histórico de versões e ficheiros do sistema.
 *     tags: [Monografias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da monografia a ser arquivada.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Monografia arquivada com sucesso.
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
 *                   example: "Monografia arquivada com sucesso."
 *       400:
 *         description: ID inválido ou a monografia já se encontra arquivada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonografiaErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Monografia não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonografiaErrorResponse'
 */
/**
 * Arquiva a monografia sem apagar o histórico de versões.
 */
const deleteMonografia = async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID da monografia inválido.'
            });
        }

        const monografia = await obterMonografia(id);

        if (!monografia) {
            return res.status(404).json({
                success: false,
                message: 'Monografia não encontrada.'
            });
        }

        if (monografia.estado === 'ARQUIVADA') {
            return res.status(400).json({
                success: false,
                message: 'A monografia já está arquivada.'
            });
        }

        await pool.query(
            `
            UPDATE monografias
            SET estado = 'ARQUIVADA'
            WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: 'Monografia arquivada com sucesso.'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMonografias,
    getMonografiaById,
    createMonografia,
    updateMonografia,
    getMonografiaVersoes,
    getMonografiaVersaoById,
    createMonografiaVersao,
    deleteMonografia
};