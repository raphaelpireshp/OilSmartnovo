const express = require('express');
const db = require('../../database/db');
const requireAdminAuth = require('../../middlewares/requireAdminAuth');

const router = express.Router();

// ==================== ROTA PARA HORÁRIOS ESPECIAIS - CLIENTE ====================

// Rota para cliente verificar horário especial em uma data específica
router.get('/api/oficina/:id/horario-especial/:data', (req, res) => {
    const { id, data } = req.params;

    console.log('🔍 Cliente verificando horário especial:', { oficina_id: id, data: data });

    const query = `
        SELECT * FROM horarios_especiais 
        WHERE oficina_id = ? AND data_especial = ?
    `;

    db.query(query, [id, data], (err, results) => {
        if (err) {
            console.error('❌ Erro ao buscar horário especial:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao verificar horário especial' 
            });
        }

        if (results.length === 0) {
            console.log('ℹ️ Nenhum horário especial encontrado');
            return res.status(404).json({ 
                success: false, 
                message: 'Nenhum horário especial encontrado para esta data' 
            });
        }

        const horarioEspecial = results[0];
        console.log('✅ Horário especial encontrado:', horarioEspecial);
        
        res.json({ 
            success: true, 
            horario_especial: horarioEspecial 
        });
    });
});
// ========== ROTA PARA CAPACIDADE DA OFICINA (CLIENTE) - VERSÃO CORRIGIDA ==========

// Rota para cliente buscar capacidade da oficina - CORRIGIDA
router.get('/api/oficina/:id/capacidade', (req, res) => {
    const { id } = req.params;

    console.log('📡 Cliente solicitando capacidade da oficina:', id);

    const query = `
        SELECT capacidade_simultanea 
        FROM oficina_capacidade 
        WHERE oficina_id = ?
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('❌ Erro ao buscar capacidade para cliente:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar capacidade' 
            });
        }
        
        if (results.length > 0 && results[0].capacidade_simultanea !== null) {
            const capacidade = results[0].capacidade_simultanea;
            console.log('✅ Capacidade encontrada para cliente:', capacidade);
            
            res.json({ 
                success: true, 
                capacidade: capacidade 
            });
        } else {
            console.log('ℹ️  Nenhuma capacidade configurada, usando padrão (1) para oficina:', id);
            res.json({ 
                success: true, 
                capacidade: 1 
            });
        }
    });
});


// ========== ROTAS DE CONFIGURAÇÕES DA OFICINA ==========









// ========== ROTAS ADICIONAIS PARA O SISTEMA DE AGENDAMENTO ==========



// Rota para buscar todas as oficinas com informações completas
router.get('/api/oficinas-completas', (req, res) => {
    const query = `
        SELECT 
            id,
            nome,
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
        WHERE horario_abertura IS NOT NULL 
        AND horario_fechamento IS NOT NULL
        AND dias_funcionamento IS NOT NULL
        ORDER BY nome
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar oficinas:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        res.json({ 
            success: true, 
            data: results 
        });
    });
});

// Rota para buscar a configuração da oficina (inclui intervalo entre agendamentos)
router.get("/api/oficina/:id/config", (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT o.id, o.nome, o.horario_abertura, o.horario_fechamento, 
               COALESCE(c.intervalo_agendamento, 45) AS intervalo_agendamento
        FROM oficina o
        LEFT JOIN oficina_config c ON o.id = c.oficina_id
        WHERE o.id = ?
    `;
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: "Oficina não encontrada" });
        res.json(results[0]);
    });
});


// ========== ROTA PARA ATUALIZAR COORDENADAS DA OFICINA ==========

router.put('/api/admin/oficina/coordenadas', requireAdminAuth, (req, res) => {
    const oficinaId = req.session.admin.oficina_id;
    const { lat, lng } = req.body;

    const query = `
        UPDATE oficina 
        SET lat = ?, lng = ?, updated_at = NOW()
        WHERE id = ?
    `;

    db.query(query, [lat, lng, oficinaId], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar coordenadas:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Oficina não encontrada' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Coordenadas atualizadas com sucesso!' 
        });
    });
});


module.exports = router;
