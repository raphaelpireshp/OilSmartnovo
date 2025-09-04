const express = require('express');
const router = express.Router();
const db = require('../database/db'); // certifique-se que o caminho está correto

// Rota para obter todas as oficinas
router.get('/oficinas', async (req, res) => {
    try {
        const sql = `
            SELECT 
                id, 
                usuario_id,
                nome, 
                cep, 
                endereco, 
                cidade, 
                estado,
                horario_abertura,
                horario_fechamento,
                dias_funcionamento
            FROM oficinas
        `;

        db.query(sql, (err, results) => {
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
        console.error('Erro no endpoint /api/oficinas:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno no servidor' 
        });
    }
});

module.exports = router;
