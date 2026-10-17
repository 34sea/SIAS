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
 *         estudante_id:
 *           type: integer
 *         estudante_nome:
 *           type: string
 *         orientador_id:
 *           type: integer
 *           nullable: true
 *         orientador_nome:
 *           type: string
 *           nullable: true
 *         titulo:
 *           type: string
 *         ano:
 *           type: integer
 *         descricao:
 *           type: string
 *           nullable: true
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
 *         versao_atual:
 *           type: integer
 *         participa_comparacao:
 *           type: boolean
 *         criado_em:
 *           type: string
 *           format: date-time
 *         atualizado_em:
 *           type: string
 *           format: date-time
 *
 *     MonografiaVersao:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         monografia_id:
 *           type: integer
 *         numero_versao:
 *           type: integer
 *         nome_ficheiro:
 *           type: string
 *         nome_original:
 *           type: string
 *         caminho_ficheiro:
 *           type: string
 *         extensao:
 *           type: string
 *         mime_type:
 *           type: string
 *         tamanho_bytes:
 *           type: integer
 *         hash_sha256:
 *           type: string
 *         estado:
 *           type: string
 *           enum: [SUBMETIDA, TEXTO_EXTRAIDO, PROCESSADA, ERRO]
 *         submetido_por:
 *           type: integer
 *         criado_em:
 *           type: string
 *           format: date-time
 *
 *     MonografiasResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         total:
 *           type: integer
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
 *         data:
 *           $ref: '#/components/schemas/Monografia'
 *
 *     MonografiaCreatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
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
 *         message:
 *           type: string
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
 * Obtém uma versão específica de uma monografia.
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

        let sql = `
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
            WHERE 1 = 1
        `;

        const params = [];

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
            if (filtro.campo === undefined) continue;

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

        if (ano !== undefined) {
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