const express = require('express');
const db = require('../../database/db');
const requireAdminAuth = require('../../middlewares/requireAdminAuth');

const router = express.Router();

// ========== ROTAS DE CONFIGURAÇÕES DA OFICINA ==========

// Carregar configurações da oficina
router.get('/api/admin/configuracoes', requireAdminAuth, (req, res) => {
    const oficinaId = req.session.admin.oficina_id;

    const query = `
        SELECT * FROM oficina 
        WHERE id = ?
    `;

    db.query(query, [oficinaId], (err, results) => {
        if (err) {
            console.error('Erro ao carregar configurações:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        if (results.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Oficina não encontrada' 
            });
        }

        res.json({ 
            success: true, 
            oficina: results[0] 
        });
    });
});

// Salvar configurações da oficina
router.put('/api/admin/configuracoes', requireAdminAuth, (req, res) => {
    const oficinaId = req.session.admin.oficina_id;
    const { 
        nome, 
        telefone, 
        endereco, 
        horario_abertura, 
        horario_fechamento, 
        dias_funcionamento 
    } = req.body;

    console.log('💾 Salvando configurações para oficina:', oficinaId);
    console.log('📝 Dados recebidos:', {
        nome,
        telefone,
        endereco,
        horario_abertura,
        horario_fechamento,
        dias_funcionamento
    });

    const query = `
        UPDATE oficina 
        SET nome = ?, 
            telefone = ?, 
            endereco = ?, 
            horario_abertura = ?, 
            horario_fechamento = ?, 
            dias_funcionamento = ?,
            updated_at = NOW()
        WHERE id = ?
    `;

    db.query(query, [
        nome, 
        telefone, 
        endereco, 
        horario_abertura, 
        horario_fechamento, 
        dias_funcionamento,
        oficinaId
    ], (err, result) => {
        if (err) {
            console.error('❌ Erro ao salvar configurações:', err);
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

        console.log('✅ Configurações salvas com sucesso!');
        
        // Atualizar a sessão com o novo nome da oficina se foi alterado
        if (req.session.admin && nome) {
            req.session.admin.oficina_nome = nome;
        }
        
        res.json({ 
            success: true, 
            message: 'Configurações salvas com sucesso!' 
        });
    });
});

// Rota para buscar horários de funcionamento da oficina
router.get('/api/admin/horarios-funcionamento', requireAdminAuth, (req, res) => {
    const oficinaId = req.session.admin.oficina_id;

    const query = `
        SELECT 
            horario_abertura,
            horario_fechamento,
            dias_funcionamento
        FROM oficina 
        WHERE id = ?
    `;

    db.query(query, [oficinaId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar horários:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        if (results.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Oficina não encontrada' 
            });
        }

        const oficina = results[0];
        
        res.json({ 
            success: true, 
            horarios: {
                abertura: oficina.horario_abertura,
                fechamento: oficina.horario_fechamento,
                dias: oficina.dias_funcionamento
            }
        });
    });
});

// Rota para verificar disponibilidade de horário
router.get('/api/admin/verificar-disponibilidade', requireAdminAuth, (req, res) => {
    const oficinaId = req.session.admin.oficina_id;
    const { data, hora } = req.query;

    if (!data || !hora) {
        return res.status(400).json({
            success: false,
            message: 'Data e hora são obrigatórios'
        });
    }

    // Verificar se já existe agendamento no mesmo horário
    const query = `
        SELECT COUNT(*) as total
        FROM agendamento_simples 
        WHERE oficina_id = ? 
        AND DATE(data_hora) = ? 
        AND TIME(data_hora) = ?
        AND status NOT IN ('cancelado', 'fora_prazo')
    `;

    db.query(query, [oficinaId, data, hora + ':00'], (err, results) => {
        if (err) {
            console.error('Erro ao verificar disponibilidade:', err);
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }

        const disponivel = results[0].total === 0;
        
        res.json({
            success: true,
            disponivel: disponivel,
            mensagem: disponivel ? 'Horário disponível' : 'Horário já ocupado'
        });
    });
});




// ========== ROTAS DE INTERVALO ENTVE AGENDAMENTOS ==========

// Rota para obter configuração do intervalo
router.get('/api/admin/configuracoes/intervalo', requireAdminAuth, (req, res) => {
    const oficinaId = req.session.admin.oficina_id;

    const query = `
        SELECT intervalo_agendamento 
        FROM oficina_config 
        WHERE oficina_id = ?
    `;

    db.query(query, [oficinaId], (err, results) => {
        if (err) {
            console.error('Erro ao carregar intervalo:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao carregar configuração de intervalo' 
            });
        }

        // Se não existir, retorna valor padrão
        const intervalo = results.length > 0 ? results[0].intervalo_agendamento : 45;
        
        res.json({ 
            success: true, 
            intervalo: intervalo 
        });
    });
});

// Rota para salvar configuração do intervalo
router.put('/api/admin/configuracoes/intervalo', requireAdminAuth, (req, res) => {
    const oficinaId = req.session.admin.oficina_id;
    const { intervalo } = req.body;

    const query = `
        INSERT INTO oficina_config (oficina_id, intervalo_agendamento, updated_at)
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
        intervalo_agendamento = VALUES(intervalo_agendamento),
        updated_at = NOW()
    `;

    db.query(query, [oficinaId, intervalo], (err, result) => {
        if (err) {
            console.error('Erro ao salvar intervalo:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao salvar configuração de intervalo' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Intervalo entre agendamentos salvo com sucesso!' 
        });
    });
});






// Rota para buscar informações completas da oficina (usada pelo frontend cliente)
router.get('/api/oficina/:id/detalhes', (req, res) => {
    const { id } = req.params;

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
        WHERE id = ?
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar detalhes da oficina:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        if (results.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Oficina não encontrada' 
            });
        }

        res.json({ 
            success: true, 
            oficina: results[0] 
        });
    });
});

// Rota para buscar horários ocupados de uma oficina em uma data específica
router.get('/api/oficina/:id/horarios-ocupados/:data', (req, res) => {
    const { id, data } = req.params;

    // Validar parâmetros
    if (!id || !data) {
        return res.status(400).json({
            success: false,
            message: 'ID da oficina e data são obrigatórios'
        });
    }

    // Validar formato da data (YYYY-MM-DD)
    const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dataRegex.test(data)) {
        return res.status(400).json({
            success: false,
            message: 'Formato de data inválido. Use YYYY-MM-DD'
        });
    }

    // Primeiro busca todos os horários ocupados (sem filtrar por capacidade)
    const query = `
        SELECT TIME(data_hora) as hora
        FROM agendamento_simples 
        WHERE oficina_id = ? 
        AND DATE(data_hora) = ?
        AND status NOT IN ('cancelado', 'fora_prazo')
        ORDER BY hora
    `;

    db.query(query, [id, data], (err, results) => {
        if (err) {
            console.error('Erro ao buscar horários ocupados:', err);
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }

        // Extrair apenas a parte da hora (HH:MM)
        const horariosOcupados = results.map(item => {
            return item.hora.substring(0, 5); // Pega apenas HH:MM
        });

        res.json({
            success: true,
            data: horariosOcupados
        });
    });
});

module.exports = router;
