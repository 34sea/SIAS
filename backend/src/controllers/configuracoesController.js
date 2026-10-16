const pool = require('../config/db');

/**
 * @swagger
 * tags:
 *   - name: ConfiguracoesSimilaridade
 *     description: Configurações e classificações de similaridade
 */

/**
 * @swagger
 * /api/configuracoes-similaridade:
 *   get:
 *     summary: Listar configurações de similaridade
 *     tags: [ConfiguracoesSimilaridade]
 *     security: - bearerAuth: []
 *   post:
 *     summary: Criar configuração
 *     tags: [ConfiguracoesSimilaridade]
 *     security: - bearerAuth: []
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
 *     tags: [ConfiguracoesSimilaridade]
 *     security: - bearerAuth: []
 *   put:
 *     summary: Actualizar configuração
 *     tags: [ConfiguracoesSimilaridade]
 *     security: - bearerAuth: []
 *   delete:
 *     summary: Eliminar configuração
 *     tags: [ConfiguracoesSimilaridade]
 *     security: - bearerAuth: []
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
