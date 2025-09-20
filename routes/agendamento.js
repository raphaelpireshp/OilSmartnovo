const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Buscar todos os agendamentos de um cliente
router.get('/:cliente_id', (req, res) => {
    const clienteId = req.params.cliente_id;

    const query = `
        SELECT a.id, a.codigo_confirmacao, a.status, a.data_agendamento, a.observacoes,
               a.servicos, a.produtos, a.data_criacao,
               v.placa, m.nome AS modelo, ma.nome AS marca,
               o.nome AS oficina, o.endereco AS oficina_endereco
        FROM agendamento a
        LEFT JOIN veiculo v ON a.veiculo_id = v.id
        LEFT JOIN modelo_ano moano ON v.modelo_ano_id = moano.id
        LEFT JOIN modelo m ON moano.modelo_id = m.id
        LEFT JOIN marca ma ON m.marca_id = ma.id
        JOIN oficina o ON a.oficina_id = o.id
        WHERE a.cliente_id = ?
        ORDER BY a.data_agendamento DESC
    `;

    db.query(query, [clienteId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar agendamentos:', err);
            return res.status(500).json({ 
                success: false, 
                erro: 'Erro ao buscar agendamentos' 
            });
        }
        
        // Parse dos dados JSON armazenados como texto
        const agendamentos = results.map(ag => ({
            ...ag,
            servicos: JSON.parse(ag.servicos || '{}'),
            produtos: JSON.parse(ag.produtos || '{}')
        }));
        
        res.json({
            success: true,
            agendamentos: agendamentos
        });
    });
});

// Atualizar status do agendamento
router.put('/:agendamento_id/status', (req, res) => {
    const { agendamento_id } = req.params;
    const { status } = req.body;
    
    // Validar status
    const statusValidos = ['pendente', 'confirmado', 'cancelado', 'concluido'];
    if (!statusValidos.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Status inválido'
        });
    }
    
    const query = 'UPDATE agendamento SET status = ? WHERE id = ?';
    
    db.query(query, [status, agendamento_id], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar status:', err);
            return res.status(500).json({
                success: false,
                message: 'Erro ao atualizar status do agendamento'
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Agendamento não encontrado'
            });
        }
        
        res.json({
            success: true,
            message: 'Status atualizado com sucesso'
        });
    });
});

module.exports = router;
