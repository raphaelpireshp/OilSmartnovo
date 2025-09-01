const express = require('express');
const router = express.Router();
const db = require('../database/db');
// Buscar todos os agendamentos de um cliente
router.get('/:cliente_id', (req, res) => {
    const clienteId = req.params.cliente_id;

    const query = `
        SELECT a.id, a.codigo_confirmacao, a.status, a.data_agendamento,
               v.placa, m.nome AS modelo, ma.nome AS marca,
               o.nome AS oficina
        FROM agendamento a
        JOIN veiculo v ON a.veiculo_id = v.id
        JOIN modelo_ano moano ON v.modelo_ano_id = moano.id
        JOIN modelo m ON moano.modelo_id = m.id
        JOIN marca ma ON m.marca_id = ma.id
        JOIN oficina o ON a.oficina_id = o.id
        WHERE a.cliente_id = ?
        ORDER BY a.data_agendamento DESC
    `;

    db.query(query, [clienteId], (err, results) => {
        if (err) {
            return res.status(500).json({ erro: 'Erro ao buscar agendamentos' });
        }
        res.json(results);
    });
});

module.exports = router;
