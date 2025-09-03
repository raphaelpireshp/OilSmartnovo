const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Rota para obter todas as oficinas, com filtros opcionais por cidade e estado
router.get('/', async (req, res) => {
    try {
        let sql = `
            SELECT
                id,
                usuario_id,
                nome,
                cep,
                endereco,
                cidade,
                estado,
                telefone,
                horario_abertura,
                horario_fechamento,
                dias_funcionamento,
                lat,
                lng
            FROM oficina
        `;
        const params = [];
        const conditions = [];

        if (req.query.cidade) {
            conditions.push('cidade = ?');
            params.push(req.query.cidade);
        }
        if (req.query.estado) {
            conditions.push('estado = ?');
            params.push(req.query.estado);
        }

        if (conditions.length > 0) {
            sql += ` WHERE ` + conditions.join(' AND ');
        }

        db.query(sql, params, (err, results) => {
            if (err) {
                console.error('Erro ao buscar oficinas:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao buscar oficinas no banco de dados'
                });
            }

            res.json({
                success: true,
                data: results
            });
        });
    } catch (error) {
        console.error('Erro no endpoint /api/oficina:', error);
        res.status(500).json({
            success:  false,
            message: 'Erro interno no servidor'
        });
    }
});

// Rota para obter oficina por ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT
            id,
            usuario_id,
            nome,
            cep,
            endereco,
            cidade,
            estado,
            telefone,
            horario_abertura,
            horario_fechamento,
            dias_funcionamento,
            lat,
            lng
        FROM oficina
        WHERE id = ?
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar oficina:', err);
            return res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                error: 'Oficina não encontrada'
            });
        }

        res.json(results[0]);
    });
});

module.exports = router;