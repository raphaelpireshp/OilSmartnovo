const express = require('express');
const db = require('../../database/db');
const requireAdminAuth = require('../../middlewares/requireAdminAuth');

const router = express.Router();

router.get('/api/admin/agendamentos/filtrados', requireAdminAuth, (req, res) => {
    const oficinaId = req.session.admin.oficina_id;
    
    // Parâmetros de paginação
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 10;
    const offset = (pagina - 1) * limite;

    // Construir query base
    let query = `
        SELECT a.*, o.nome as oficina_nome
        FROM agendamento_simples a
        JOIN oficina o ON a.oficina_id = o.id
        WHERE a.oficina_id = ?
    `;
    
    const params = [oficinaId];
    
    // Aplicar filtros
    if (req.query.status && req.query.status !== 'todos') {
        query += ' AND a.status = ?';
        params.push(req.query.status);
    }
    
    if (req.query.dataInicio) {
        query += ' AND DATE(a.data_hora) >= ?';
        params.push(req.query.dataInicio);
    }
    
    if (req.query.dataFim) {
        query += ' AND DATE(a.data_hora) <= ?';
        params.push(req.query.dataFim);
    }
    
    if (req.query.cliente) {
        query += ' AND a.cliente_nome LIKE ?';
        params.push(`%${req.query.cliente}%`);
    }
    
    if (req.query.telefone) {
        query += ' AND a.cliente_telefone LIKE ?';
        params.push(`%${req.query.telefone}%`);
    }
    
    if (req.query.veiculo) {
        query += ' AND a.veiculo LIKE ?';
        params.push(`%${req.query.veiculo}%`);
    }
    
    // FILTRO DE SERVIÇOS SIMPLIFICADO (apenas troca de óleo e filtro)
    if (req.query.servico && req.query.servico !== 'todos') {
        if (req.query.servico === 'troca_oleo') {
            query += ' AND a.servicos LIKE ?';
            params.push('%troca de óleo%');
        } else if (req.query.servico === 'filtro') {
            query += ' AND (a.servicos LIKE ? OR a.servicos LIKE ?)';
            params.push('%filtro de óleo%', '%filtro%');
        }
    }
    
    if (req.query.protocolo) {
        query += ' AND a.protocolo LIKE ?';
        params.push(`%${req.query.protocolo}%`);
    }
    
    // Ordenação
    const ordenarPor = req.query.ordenarPor || 'data_desc';
    switch (ordenarPor) {
        case 'data_asc':
            query += ' ORDER BY a.data_hora ASC';
            break;
        case 'cliente_asc':
            query += ' ORDER BY a.cliente_nome ASC';
            break;
        case 'cliente_desc':
            query += ' ORDER BY a.cliente_nome DESC';
            break;

        default: // data_desc
            query += ' ORDER BY a.data_hora DESC';
    }
    
    // Query para contar total (para paginação)
    const countQuery = query.replace(/SELECT a\.\*, o\.nome as oficina_nome/, 'SELECT COUNT(*) as total');
    
    // Adicionar paginação à query principal
    query += ' LIMIT ? OFFSET ?';
    params.push(limite, offset);
    
    console.log('📋 Query executada:', query);
    console.log('🔍 Parâmetros:', params);
    
    // Executar ambas as queries
    db.query(countQuery, params.slice(0, -2), (err, countResults) => {
        if (err) {
            console.error('❌ Erro ao contar agendamentos:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }
        
        const total = countResults[0].total;
        const totalPaginas = Math.ceil(total / limite);
        
        db.query(query, params, (err, results) => {
            if (err) {
                console.error('❌ Erro ao buscar agendamentos:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro interno do servidor' 
                });
            }
            
            res.json({
                success: true,
                agendamentos: results,
                total: total,
                pagina: pagina,
                totalPaginas: totalPaginas,
                limite: limite
            });
        });
    });
});
// ========== ROTAS ESPECÍFICAS (DEVEM VIR ANTES DAS ROTAS COM :id) ==========

// Rota para concluir agendamento pelo protocolo "OILxxxx" - CORRIGIDA
router.put('/api/admin/agendamentos/concluir-por-protocolo', requireAdminAuth, (req, res) => {
    const { protocolo } = req.body;
    const oficinaId = req.session.admin.oficina_id;

    console.log('🔍 Buscando protocolo:', protocolo, 'para oficina:', oficinaId);

    if (!protocolo || protocolo.trim() === '') {
        return res.status(400).json({ 
            success: false, 
            message: 'Protocolo é obrigatório' 
        });
    }

    const protocoloTrim = protocolo.toString().trim();

    const query = `
        UPDATE agendamento_simples 
        SET status = 'concluido', 
            data_conclusao = NOW()
        WHERE protocolo = ? 
        AND oficina_id = ?
        AND status IN ('pendente', 'confirmado')
    `;

    db.query(query, [protocoloTrim, oficinaId], (err, result) => {
        if (err) {
            console.error('❌ Erro ao concluir por protocolo:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        console.log('📊 Resultado da atualização:', result.affectedRows, 'linhas afetadas');

        if (result.affectedRows === 0) {
            // Buscar informações para debug
            const debugQuery = `
                SELECT id, protocolo, status, oficina_id 
                FROM agendamento_simples 
                WHERE protocolo = ? 
            `;
            
            db.query(debugQuery, [protocoloTrim], (debugErr, debugResults) => {
                if (debugErr) {
                    console.error('Erro no debug:', debugErr);
                }
                
                console.log('🔍 Debug - Agendamentos encontrados com este protocolo:', debugResults);
                
                return res.status(404).json({ 
                    success: false, 
                    message: 'Protocolo não encontrado ou agendamento já concluído/cancelado',
                    debug: {
                        protocolo_buscado: protocoloTrim,
                        encontrados: debugResults,
                        oficina_sessao: oficinaId
                    }
                });
            });
            return;
        }

        res.json({ 
            success: true, 
            message: 'Agendamento concluído com sucesso!',
            protocolo: protocoloTrim
        });
    });
});

// Rota para concluir agendamento específico por ID
router.put('/api/admin/agendamentos/:id/concluir', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const oficinaId = req.session.admin.oficina_id;

    const query = `
        UPDATE agendamento_simples 
        SET status = 'concluido', 
            data_conclusao = NOW()
        WHERE id = ? 
        AND oficina_id = ?
    `;

    db.query(query, [id, oficinaId], (err, result) => {
        if (err) {
            console.error('Erro ao concluir agendamento:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
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
            message: 'Agendamento concluído com sucesso!' 
        });
    });
});

// Rota alternativa para conclusão por protocolo
router.put('/api/admin/concluir-protocolo', requireAdminAuth, (req, res) => {
    const { protocolo } = req.body;
    const oficinaId = req.session.admin.oficina_id;

    console.log('🎯 Rota alternativa chamada com protocolo:', protocolo);

    if (!protocolo) {
        return res.status(400).json({ success: false, message: 'Protocolo é obrigatório' });
    }

    const query = `
        UPDATE agendamento_simples 
        SET status = 'concluido', data_conclusao = NOW()
        WHERE protocolo = ? AND oficina_id = ?
    `;

    db.query(query, [protocolo.trim(), oficinaId], (err, result) => {
        if (err) {
            console.error('Erro:', err);
            return res.status(500).json({ success: false, message: 'Erro no servidor' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Protocolo não encontrado' });
        }

        res.json({ success: true, message: 'Agendamento concluído!' });
    });
});


router.get('/api/admin/agendamentos', requireAdminAuth, (req, res) => {
    const oficinaId = req.session.admin.oficina_id;
    const status = req.query.status;
    
    let query = `
        SELECT a.*, o.nome as oficina_nome
        FROM agendamento_simples a
        JOIN oficina o ON a.oficina_id = o.id
        WHERE a.oficina_id = ?
    `;
    
    const params = [oficinaId];
    
    if (status && status !== 'todos') {
        query += ' AND a.status = ?';
        params.push(status);
    }
    
    query += ' ORDER BY a.data_hora DESC';
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Erro ao buscar agendamentos:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }
        
        res.json({
            success: true,
            agendamentos: results
        });
    });
});

// Buscar agendamento específico
router.get('/api/admin/agendamentos/:id', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const oficinaId = req.session.admin.oficina_id;
    
    const query = `
        SELECT a.*, o.nome as oficina_nome
        FROM agendamento_simples a
        JOIN oficina o ON a.oficina_id = o.id
        WHERE a.id = ? AND a.oficina_id = ?
    `;
    
    db.query(query, [id, oficinaId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar agendamento:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Agendamento não encontrado' 
            });
        }
        
        res.json({
            success: true,
            agendamento: results[0]
        });
    });
});

// Atualizar agendamento
router.put('/api/admin/agendamentos/:id', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const oficinaId = req.session.admin.oficina_id;
    
    // Verificar se o agendamento pertence à oficina
    const checkQuery = `
        SELECT id FROM agendamento_simples 
        WHERE id = ? AND oficina_id = ?
    `;
    
    db.query(checkQuery, [id, oficinaId], (err, results) => {
        if (err) {
            console.error('Erro ao verificar agendamento:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Agendamento não encontrado' 
            });
        }
        
        // Atualizar status
        const updateQuery = `
            UPDATE agendamento_simples 
            SET status = ? 
            WHERE id = ?
        `;
        
        db.query(updateQuery, [status, id], (err, result) => {
            if (err) {
                console.error('Erro ao atualizar agendamento:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro interno do servidor' 
                });
            }
            
            res.json({
                success: true,
                message: 'Status atualizado com sucesso'
            });
        });
    });
});

// Adicionar protocolo ao agendamento
router.put('/api/admin/agendamentos/:id/protocolo', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const { protocolo, status } = req.body;
    const oficinaId = req.session.admin.oficina_id;

    const query = `
        UPDATE agendamento_simples 
        SET protocolo = ?, 
            status = ?
        WHERE id = ? AND oficina_id = ?
    `;

    db.query(query, [protocolo, status, id, oficinaId], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar protocolo:', err);
            return res.status(500).json({
                success: false,
                message: 'Erro ao adicionar protocolo'
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
            message: 'Protocolo adicionado com sucesso'
        });
    });
});

// Registrar divergência
router.put('/api/admin/agendamentos/:id/divergencia', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const { divergencia, status } = req.body;
    const oficinaId = req.session.admin.oficina_id;

    console.log('🎯 Registrar divergência - Agendamento:', id);
    console.log('🎯 Divergência:', divergencia);

    const query = `
        UPDATE agendamento_simples 
        SET divergencia = ?,
            status = ?
        WHERE id = ? AND oficina_id = ?
    `;

    db.query(query, [divergencia, status, id, oficinaId], (err, result) => {
        if (err) {
            console.error('❌ Erro ao registrar divergência:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Agendamento não encontrado' 
            });
        }

        console.log('✅ Divergência registrada com sucesso!');
        
        res.json({
            success: true,
            message: 'Divergência registrada com sucesso!'
        });
    });
});

// Cancelar agendamento
router.put('/api/admin/agendamentos/:id/cancelar', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const { status, motivo_cancelamento, cancelado_por } = req.body;
    const oficinaId = req.session.admin.oficina_id;

    const query = `
        UPDATE agendamento_simples 
        SET status = ?,
            motivo_cancelamento = ?,
            cancelado_por = ?,
            data_cancelamento = NOW()
        WHERE id = ? AND oficina_id = ?
    `;

    db.query(query, [status, motivo_cancelamento, cancelado_por, id, oficinaId], (err, result) => {
        if (err) {
            console.error('Erro ao cancelar agendamento:', err);
            return res.status(500).json({
                success: false,
                message: 'Erro ao cancelar agendamento'
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
            message: 'Agendamento cancelado com sucesso'
        });
    });
});

// Endpoint de debug para protocolos
router.get('/api/admin/debug/protocolos', requireAdminAuth, (req, res) => {
    const oficinaId = req.session.admin.oficina_id;
    
    const query = `
        SELECT id, protocolo, status, cliente_nome, data_hora
        FROM agendamento_simples 
        WHERE oficina_id = ?
        ORDER BY data_hora DESC
        LIMIT 10
    `;
    
    db.query(query, [oficinaId], (err, results) => {
        if (err) {
            console.error('Erro no debug:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        
        res.json({
            success: true,
            protocolos: results,
            oficina_id: oficinaId
        });
    });
});

// Estoque

module.exports = router;
