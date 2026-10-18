const pool = require('../config/db');

/**
 * @swagger
 * tags:
 *   - name: ConfiguracoesSimilaridade
 *     description: Configurações e classificações de similaridade
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ConfiguracaoSimilaridade:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         limite_baixo:
 *           type: number
 *           format: float
 *           description: "Limite inferior para a classificação da similaridade"
 *           example: 20.0
 *         limite_medio:
 *           type: number
 *           format: float
 *           description: "Limite médio para a classificação da similaridade"
 *           example: 50.0
 *         limite_alto:
 *           type: number
 *           format: float
 *           description: "Limite superior/alto para a classificação da similaridade"
 *           example: 80.0
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
 *
 *     CreateConfiguracaoRequest:
 *       type: object
 *       required:
 *         - limite_baixo
 *         - limite_medio
 *         - limite_alto
 *       properties:
 *         limite_baixo:
 *           type: number
 *           format: float
 *           example: 20.0
 *         limite_medio:
 *           type: number
 *           format: float
 *           example: 50.0
 *         limite_alto:
 *           type: number
 *           format: float
 *           example: 80.0
 *         ativo:
 *           type: boolean
 *           example: true
 *
 *     UpdateConfiguracaoRequest:
 *       type: object
 *       properties:
 *         limite_baixo:
 *           type: number
 *           format: float
 *           example: 25.0
 *         limite_medio:
 *           type: number
 *           format: float
 *           example: 55.0
 *         limite_alto:
 *           type: number
 *           format: float
 *           example: 85.0
 *         ativo:
 *           type: boolean
 *           example: true
 *
 *     ConfiguracoesResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         total:
 *           type: integer
 *           example: 2
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ConfiguracaoSimilaridade'
 *
 *     ConfiguracaoResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/ConfiguracaoSimilaridade'
 *
 *     ConfiguracaoErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Configuração não encontrada."
 */

/**
 * @swagger
 * /api/configuracoes-similaridade:
 *   get:
 *     summary: Listar configurações de similaridade
 *     description: Retorna a lista de todas as configurações e limites de similaridade registados no sistema, ordenados do mais recente para o mais antigo.
 *     tags: [ConfiguracoesSimilaridade]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de configurações obtida com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConfiguracoesResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *
 *   post:
 *     summary: Criar configuração
 *     description: Cria uma nova regra ou limiares de classificação de similaridade para as análises de monografias.
 *     tags: [ConfiguracoesSimilaridade]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateConfiguracaoRequest'
 *     responses:
 *       201:
 *         description: Configuração criada com sucesso.
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
 *                   example: "Configuração criada com sucesso."
 *                 data:
 *                   $ref: '#/components/schemas/ConfiguracaoSimilaridade'
 *       400:
 *         description: Campos obrigatórios em falta ou dados inválidos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConfiguracaoErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 */
const getConfiguracoes = async (req, res, next) => {
    try {
        const [configs] = await pool.query(
            `SELECT * FROM configuracoes_similaridade ORDER BY id DESC`
        );
        return res.status(200).json({ success: true, total: configs.length, data: configs });
    } catch (error) { next(error); }
};

/**
 * @swagger
 * /api/configuracoes-similaridade/{id}:
 *   get:
 *     summary: Obter configuração por ID
 *     description: Retorna os detalhes de uma configuração de similaridade específica através do seu ID.
 *     tags: [ConfiguracoesSimilaridade]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da configuração de similaridade.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Configuração encontrada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConfiguracaoResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Configuração não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConfiguracaoErrorResponse'
 *
 *   put:
 *     summary: Actualizar configuração
 *     description: Actualiza os limiares e parâmetros de uma configuração de similaridade existente.
 *     tags: [ConfiguracoesSimilaridade]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da configuração de similaridade.
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateConfiguracaoRequest'
 *     responses:
 *       200:
 *         description: Configuração actualizada com sucesso.
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
 *                   example: "Configuração actualizada com sucesso."
 *                 data:
 *                   $ref: '#/components/schemas/ConfiguracaoSimilaridade'
 *       400:
 *         description: Nenhum campo enviado para actualização ou ID inválido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConfiguracaoErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Configuração não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConfiguracaoErrorResponse'
 *
 *   delete:
 *     summary: Eliminar configuração
 *     description: Remove permanentemente uma configuração de similaridade do sistema através do seu ID.
 *     tags: [ConfiguracoesSimilaridade]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da configuração de similaridade.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Configuração eliminada com sucesso.
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
 *                   example: "Configuração eliminada com sucesso."
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Configuração não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConfiguracaoErrorResponse'
 */
const getConfiguracaoById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`SELECT * FROM configuracoes_similaridade WHERE id = ? LIMIT 1`, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Configuração não encontrada.' });
        }
        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) { next(error); }
};
/**
 * @swagger
 * components:
 *   schemas:
 *     CreateConfiguracaoRequest:
 *       type: object
 *       required:
 *         - nome
 *         - algoritmo
 *       properties:
 *         nome:
 *           type: string
 *           description: Nome descritivo da configuração de similaridade.
 *           example: "Configuração Padrão - Híbrida"
 *         algoritmo:
 *           type: string
 *           description: Algoritmo utilizado para o cálculo (ex. TF-IDF, Cosine, etc.).
 *           example: "TF-IDF + Embeddings"
 *         peso_textual:
 *           type: number
 *           format: float
 *           description: Peso atribuído à análise estritamente textual (padrão 50).
 *           example: 50
 *         peso_semantico:
 *           type: number
 *           format: float
 *           description: Peso atribuído à análise semântica (padrão 50).
 *           example: 50
 *         similaridade_minima:
 *           type: number
 *           format: float
 *           description: Limiar mínimo de similaridade para considerar uma correspondência (padrão 10).
 *           example: 10
 *         limite_documentos:
 *           type: integer
 *           description: Número máximo de documentos comparados em simultâneo (padrão 10).
 *           example: 10
 *         ignorar_bibliografia:
 *           type: boolean
 *           description: Ignorar secções de bibliografia/referências bibliográficas (padrão true).
 *           example: true
 *         ignorar_capa:
 *           type: boolean
 *           description: Ignorar a capa do documento (padrão true).
 *           example: true
 *         ignorar_indice:
 *           type: boolean
 *           description: Ignorar o índice/sumário (padrão true).
 *           example: true
 *         ignorar_anexos:
 *           type: boolean
 *           description: Ignorar anexos e apêndices (padrão true).
 *           example: true
 *         ignorar_citacoes:
 *           type: boolean
 *           description: Ignorar citações textuais longas (padrão true).
 *           example: true
 *         ignorar_palavras_comuns:
 *           type: boolean
 *           description: Ignorar stop-words / palavras comuns (padrão true).
 *           example: true
 *         ativa:
 *           type: boolean
 *           description: Define se esta configuração será a ativa no sistema (ao ativar, as restantes são desativadas).
 *           example: true
 *         criado_por:
 *           type: integer
 *           nullable: true
 *           description: ID do administrador que criou a configuração.
 *           example: 1
 *
 *     ConfiguracaoCreatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Configuração criada com sucesso."
 *         data:
 *           $ref: '#/components/schemas/ConfiguracaoSimilaridade'
 */

/**
 * @swagger
 * /api/configuracoes-similaridade:
 *   post:
 *     summary: Criar configuração de similaridade
 *     description: Cria uma nova regra personalizada para os motores de cálculo de similaridade de monografias, permitindo definir pesos, limiares e secções a ignorar. Caso seja marcada como ativa, desativa automaticamente as demais.
 *     tags: [ConfiguracoesSimilaridade]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateConfiguracaoRequest'
 *     responses:
 *       201:
 *         description: Configuração criada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConfiguracaoCreatedResponse'
 *       400:
 *         description: Campos obrigatórios em falta (nome ou algoritmo) ou dados inválidos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConfiguracaoErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 */
const createConfiguracao = async (req, res, next) => {
    try {
        const {
            nome, algoritmo, peso_textual, peso_semantico, similaridade_minima,
            limite_documentos, ignorar_bibliografia, ignorar_capa, ignorar_indice,
            ignorar_anexos, ignorar_citacoes, ignorar_palavras_comuns, ativa, criado_por
        } = req.body;
        if (!nome || !algoritmo) {
            return res.status(400).json({ success: false, message: 'Nome e algoritmo são obrigatórios.' });
        }
        // Se activar esta, desactivar as outras
        if (ativa === '1' || ativa === true) {
            await pool.query(`UPDATE configuracoes_similaridade SET ativa = FALSE`);
        }
        const [resultado] = await pool.query(
            `INSERT INTO configuracoes_similaridade (nome, algoritmo, peso_textual, peso_semantico,
                    similaridade_minima, limite_documentos, ignorar_bibliografia, ignorar_capa,
                    ignorar_indice, ignorar_anexos, ignorar_citacoes, ignorar_palavras_comuns,
                    ativa, criado_por)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nome, algoritmo,
                peso_textual !== undefined ? peso_textual : 50,
                peso_semantico !== undefined ? peso_semantico : 50,
                similaridade_minima !== undefined ? similaridade_minima : 10,
                limite_documentos !== undefined ? limite_documentos : 10,
                ignorar_bibliografia !== undefined ? (ignorar_bibliografia === '1' || ignorar_bibliografia === true ? 1 : 0) : 1,
                ignorar_capa !== undefined ? (ignorar_capa === '1' || ignorar_capa === true ? 1 : 0) : 1,
                ignorar_indice !== undefined ? (ignorar_indice === '1' || ignorar_indice === true ? 1 : 0) : 1,
                ignorar_anexos !== undefined ? (ignorar_anexos === '1' || ignorar_anexos === true ? 1 : 0) : 1,
                ignorar_citacoes !== undefined ? (ignorar_citacoes === '1' || ignorar_citacoes === true ? 1 : 0) : 1,
                ignorar_palavras_comuns !== undefined ? (ignorar_palavras_comuns === '1' || ignorar_palavras_comuns === true ? 1 : 0) : 1,
                ativa === '1' || ativa === true ? 1 : 0,
                criado_por || null
            ]
        );
        const [config] = await pool.query(`SELECT * FROM configuracoes_similaridade WHERE id = ?`, [resultado.insertId]);
        return res.status(201).json({ success: true, message: 'Configuração criada com sucesso.', data: config[0] });
    } catch (error) { next(error); }
};
/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateConfiguracaoRequest:
 *       type: object
 *       properties:
 *         nome:
 *           type: string
 *           description: Nome descritivo da configuração de similaridade.
 *           example: "Configuração Personalizada - Avançada"
 *         algoritmo:
 *           type: string
 *           description: Algoritmo utilizado para o cálculo.
 *           example: "TF-IDF + Embeddings"
 *         peso_textual:
 *           type: number
 *           format: float
 *           description: Peso atribuído à análise estritamente textual.
 *           example: 60
 *         peso_semantico:
 *           type: number
 *           format: float
 *           description: Peso atribuído à análise semântica.
 *           example: 40
 *         similaridade_minima:
 *           type: number
 *           format: float
 *           description: Limiar mínimo de similaridade.
 *           example: 15
 *         limite_documentos:
 *           type: integer
 *           description: Número máximo de documentos comparados em simultâneo.
 *           example: 15
 *         ignorar_bibliografia:
 *           type: boolean
 *           description: Ignorar secções de bibliografia/referências.
 *           example: true
 *         ignorar_capa:
 *           type: boolean
 *           description: Ignorar a capa do documento.
 *           example: true
 *         ignorar_indice:
 *           type: boolean
 *           description: Ignorar o índice/sumário.
 *           example: true
 *         ignorar_anexos:
 *           type: boolean
 *           description: Ignorar anexos e apêndices.
 *           example: true
 *         ignorar_citacoes:
 *           type: boolean
 *           description: Ignorar citações textuais longas.
 *           example: true
 *         ignorar_palavras_comuns:
 *           type: boolean
 *           description: Ignorar stop-words / palavras comuns.
 *           example: true
 *         ativa:
 *           type: boolean
 *           description: Define se esta configuração será a ativa no sistema.
 *           example: true
 *
 *     ConfiguracaoUpdatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Configuração actualizada com sucesso."
 *         data:
 *           $ref: '#/components/schemas/ConfiguracaoSimilaridade'
 */

/**
 * @swagger
 * /api/configuracoes-similaridade/{id}:
 *   put:
 *     summary: Actualizar configuração de similaridade
 *     description: Actualiza os parâmetros de uma configuração de similaridade existente. Caso seja marcada como ativa, desativa automaticamente as demais.
 *     tags: [ConfiguracoesSimilaridade]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da configuração de similaridade.
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateConfiguracaoRequest'
 *     responses:
 *       200:
 *         description: Configuração actualizada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConfiguracaoUpdatedResponse'
 *       400:
 *         description: Nenhum campo enviado para actualização ou ID inválido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConfiguracaoErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Configuração não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConfiguracaoErrorResponse'
 *
 *   delete:
 *     summary: Eliminar configuração de similaridade
 *     description: Remove permanentemente uma configuração de similaridade do sistema através do seu ID.
 *     tags: [ConfiguracoesSimilaridade]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da configuração de similaridade.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Configuração eliminada com sucesso.
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
 *                   example: "Configuração eliminada com sucesso."
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Configuração não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConfiguracaoErrorResponse'
 */
const updateConfiguracao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { ativa, ...rest } = req.body;
        const [existente] = await pool.query(`SELECT id FROM configuracoes_similaridade WHERE id = ? LIMIT 1`, [id]);
        if (existente.length === 0) {
            return res.status(404).json({ success: false, message: 'Configuração não encontrada.' });
        }
        if (ativa === '1' || ativa === true) {
            await pool.query(`UPDATE configuracoes_similaridade SET ativa = FALSE`);
        }
        const campos = [];
        const valores = [];
        const camposPermitidos = [
            'nome', 'algoritmo', 'peso_textual', 'peso_semantico', 'similaridade_minima',
            'limite_documentos', 'ignorar_bibliografia', 'ignorar_capa', 'ignorar_indice',
            'ignorar_anexos', 'ignorar_citacoes', 'ignorar_palavras_comuns', 'ativa'
        ];
        for (const campo of camposPermitidos) {
            if (rest[campo] !== undefined) {
                let valor = rest[campo];
                if (typeof valor === 'boolean') {
                    valor = valor ? 1 : 0;
                } else if (valor === '1' || valor === '0') {
                    valor = valor === '1' ? 1 : 0;
                }
                campos.push(`${campo} = ?`);
                valores.push(valor);
            }
        }
        if (campos.length === 0) {
            return res.status(400).json({ success: false, message: 'Nenhum campo enviado para actualização.' });
        }
        valores.push(id);
        await pool.query(`UPDATE configuracoes_similaridade SET ${campos.join(', ')} WHERE id = ?`, valores);
        const [config] = await pool.query(`SELECT * FROM configuracoes_similaridade WHERE id = ?`, [id]);
        return res.status(200).json({ success: true, message: 'Configuração actualizada com sucesso.', data: config[0] });
    } catch (error) { next(error); }
};

const deleteConfiguracao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [existente] = await pool.query(`SELECT id FROM configuracoes_similaridade WHERE id = ? LIMIT 1`, [id]);
        if (existente.length === 0) {
            return res.status(404).json({ success: false, message: 'Configuração não encontrada.' });
        }
        await pool.query(`DELETE FROM configuracoes_similaridade WHERE id = ?`, [id]);
        return res.status(200).json({ success: true, message: 'Configuração eliminada com sucesso.' });
    } catch (error) { next(error); }
};

// ---------------- Classificações ----------------
/**
 * @swagger
 * tags:
 *   - name: ConfiguracoesSimilaridade
 *     description: Configurações e classificações de similaridade
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ClassificacaoSimilaridade:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nome:
 *           type: string
 *           description: Nome da classificação (ex. Baixa, Moderada, Elevada).
 *           example: "Moderada"
 *         percentual_minimo:
 *           type: number
 *           format: float
 *           description: Percentual mínimo que define esta faixa de classificação.
 *           example: 20.0
 *         percentual_maximo:
 *           type: number
 *           format: float
 *           description: Percentual máximo que define esta faixa de classificação.
 *           example: 50.0
 *         descricao:
 *           type: string
 *           nullable: true
 *           description: Descrição detalhada da classificação e implicações.
 *           example: "Similaridade aceitável, requer verificação pontual de citações."
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
 *
 *     CreateClassificacaoRequest:
 *       type: object
 *       required:
 *         - nome
 *         - percentual_minimo
 *         - percentual_maximo
 *       properties:
 *         nome:
 *           type: string
 *           example: "Moderada"
 *         percentual_minimo:
 *           type: number
 *           format: float
 *           example: 20.0
 *         percentual_maximo:
 *           type: number
 *           format: float
 *           example: 50.0
 *         descricao:
 *           type: string
 *           nullable: true
 *           example: "Similaridade aceitável com verificação."
 *         ativo:
 *           type: boolean
 *           example: true
 *
 *     UpdateClassificacaoRequest:
 *       type: object
 *       properties:
 *         nome:
 *           type: string
 *           example: "Moderada / Aceitável"
 *         percentual_minimo:
 *           type: number
 *           format: float
 *           example: 20.0
 *         percentual_maximo:
 *           type: number
 *           format: float
 *           example: 49.9
 *         descricao:
 *           type: string
 *           nullable: true
 *           example: "Actualização da descrição da faixa."
 *         ativo:
 *           type: boolean
 *           example: true
 *
 *     ClassificacoesResponse:
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
 *             $ref: '#/components/schemas/ClassificacaoSimilaridade'
 *
 *     ClassificacaoResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/ClassificacaoSimilaridade'
 *
 *     ClassificacaoErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Classificação não encontrada."
 */

/**
 * @swagger
 * /api/classificacoes-similaridade:
 *   get:
 *     summary: Listar classificações de similaridade
 *     description: Retorna a lista de todas as faixas e patamares de classificação de similaridade registados no sistema, ordenados pelo percentual mínimo de forma ascendente.
 *     tags: [ConfiguracoesSimilaridade]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de classificações obtida com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassificacoesResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *
 *   post:
 *     summary: Criar classificação de similaridade
 *     description: Cria uma nova faixa percentual para classificar o nível de similaridade dos documentos submetidos.
 *     tags: [ConfiguracoesSimilaridade]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClassificacaoRequest'
 *     responses:
 *       201:
 *         description: Classificação criada com sucesso.
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
 *                   example: "Classificação criada com sucesso."
 *                 data:
 *                   $ref: '#/components/schemas/ClassificacaoSimilaridade'
 *       400:
 *         description: Campos obrigatórios em falta (nome, percentual_minimo ou percentual_maximo).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassificacaoErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 */
const getClassificacoes = async (req, res, next) => {
    try {
        const [classificacoes] = await pool.query(
            `SELECT * FROM classificacoes_similaridade ORDER BY percentual_minimo ASC`
        );
        return res.status(200).json({ success: true, total: classificacoes.length, data: classificacoes });
    } catch (error) { next(error); }
};

const createClassificacao = async (req, res, next) => {
    try {
        const { nome, percentual_minimo, percentual_maximo, descricao, ativo } = req.body;
        if (!nome || percentual_minimo === undefined || percentual_maximo === undefined) {
            return res.status(400).json({ success: false, message: 'Nome, mínimo e máximo são obrigatórios.' });
        }
        const [resultado] = await pool.query(
            `INSERT INTO classificacoes_similaridade (nome, percentual_minimo, percentual_maximo, descricao, ativo)
             VALUES (?, ?, ?, ?, ?)`,
            [nome, percentual_minimo, percentual_maximo, descricao || null, ativo !== undefined ? (ativo === '1' || ativo === true ? 1 : 0) : 1]
        );
        const [classificacao] = await pool.query(`SELECT * FROM classificacoes_similaridade WHERE id = ?`, [resultado.insertId]);
        return res.status(201).json({ success: true, message: 'Classificação criada com sucesso.', data: classificacao[0] });
    } catch (error) { next(error); }
};
/**
 * @swagger
 * /api/classificacoes-similaridade/{id}:
 *   put:
 *     summary: Actualizar classificação de similaridade
 *     description: Actualiza os parâmetros de uma faixa de classificação de similaridade existente através do seu ID.
 *     tags: [ConfiguracoesSimilaridade]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da classificação de similaridade.
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateClassificacaoRequest'
 *     responses:
 *       200:
 *         description: Classificação actualizada com sucesso.
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
 *                   example: "Classificação actualizada com sucesso."
 *                 data:
 *                   $ref: '#/components/schemas/ClassificacaoSimilaridade'
 *       400:
 *         description: Nenhum campo enviado para actualização ou ID inválido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassificacaoErrorResponse'
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Classificação não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassificacaoErrorResponse'
 *
 *   delete:
 *     summary: Eliminar classificação de similaridade
 *     description: Remove permanentemente uma faixa de classificação de similaridade do sistema através do seu ID.
 *     tags: [ConfiguracoesSimilaridade]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da classificação de similaridade.
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Classificação eliminada com sucesso.
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
 *                   example: "Classificação eliminada com sucesso."
 *       401:
 *         description: Não autenticado ou token inválido.
 *       404:
 *         description: Classificação não encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassificacaoErrorResponse'
 */
const updateClassificacao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nome, percentual_minimo, percentual_maximo, descricao, ativo } = req.body;
        const [existente] = await pool.query(`SELECT id FROM classificacoes_similaridade WHERE id = ? LIMIT 1`, [id]);
        if (existente.length === 0) {
            return res.status(404).json({ success: false, message: 'Classificação não encontrada.' });
        }
        const campos = [];
        const valores = [];
        if (nome !== undefined) { campos.push('nome = ?'); valores.push(nome); }
        if (percentual_minimo !== undefined) { campos.push('percentual_minimo = ?'); valores.push(percentual_minimo); }
        if (percentual_maximo !== undefined) { campos.push('percentual_maximo = ?'); valores.push(percentual_maximo); }
        if (descricao !== undefined) { campos.push('descricao = ?'); valores.push(descricao); }
        if (ativo !== undefined) { campos.push('ativo = ?'); valores.push(ativo === '1' || ativo === true ? 1 : 0); }
        if (campos.length === 0) {
            return res.status(400).json({ success: false, message: 'Nenhum campo enviado para actualização.' });
        }
        valores.push(id);
        await pool.query(`UPDATE classificacoes_similaridade SET ${campos.join(', ')} WHERE id = ?`, valores);
        const [classificacao] = await pool.query(`SELECT * FROM classificacoes_similaridade WHERE id = ?`, [id]);
        return res.status(200).json({ success: true, message: 'Classificação actualizada com sucesso.', data: classificacao[0] });
    } catch (error) { next(error); }
};

const deleteClassificacao = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [existente] = await pool.query(`SELECT id FROM classificacoes_similaridade WHERE id = ? LIMIT 1`, [id]);
        if (existente.length === 0) {
            return res.status(404).json({ success: false, message: 'Classificação não encontrada.' });
        }
        await pool.query(`DELETE FROM classificacoes_similaridade WHERE id = ?`, [id]);
        return res.status(200).json({ success: true, message: 'Classificação eliminada com sucesso.' });
    } catch (error) { next(error); }
};

module.exports = {
    getConfiguracoes,
    getConfiguracaoById,
    createConfiguracao,
    updateConfiguracao,
    deleteConfiguracao,
    getClassificacoes,
    createClassificacao,
    updateClassificacao,
    deleteClassificacao
};
