const pool = require('../config/db');

/**
 * @swagger
 * tags:
 *   - name: Orientacoes
 *     description: Associação entre estudantes e orientadores
 */


const getOrientacoes = async (req, res, next) => {
    try {
        const { estudante_id, docente_id, estado } = req.query;

        let sql = `
            SELECT
                o.id,
                o.estudante_id,
                o.docente_id,

                -- Dados do estudante
                ue.nome_completo AS estudante_nome,
                ue.email AS estudante_email,
                ue.foto AS estudante_foto,

                -- Dados do curso do estudante
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

            WHERE 1=1
        `;

        const params = [];

        if (estudante_id) {
            sql += ` AND o.estudante_id = ?`;
            params.push(estudante_id);
        }

        if (docente_id) {
            sql += ` AND o.docente_id = ?`;
            params.push(docente_id);
        }

        if (estado) {
            sql += ` AND o.estado = ?`;
            params.push(estado);
        }

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