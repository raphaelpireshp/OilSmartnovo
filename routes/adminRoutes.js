// adminRoutes.js - VERSÃO CORRIGIDA E COMPLETA
const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Middleware para verificar se é admin de oficina
function checkOficinaAdmin(req, res, next) {
    // Verificar se o usuário está autenticado e é admin
    if (!req.session.admin) {
        return res.status(401).json({ 
            success: false, 
            message: 'Não autorizado' 
        });
    }
    next();
}

// Dashboard da oficina
router.get('/dashboard', checkOficinaAdmin, (req, res) => {
    const oficina_id = req.session.admin.oficina_id;

    const queries = {
        totalAgendamentos: `
            SELECT COUNT(*) as total FROM agendamento_simples 
            WHERE oficina_id = ?
        `,
        agendamentosPendentes: `
            SELECT COUNT(*) as total FROM agendamento_simples 
            WHERE oficina_id = ? AND status = 'pendente'
        `,
        agendamentosConfirmados: `
            SELECT COUNT(*) as total FROM agendamento_simples 
            WHERE oficina_id = ? AND status = 'confirmado'
        `,
        agendamentosConcluidos: `
            SELECT COUNT(*) as total FROM agendamento_simples 
            WHERE oficina_id = ? AND status = 'concluido'
        `,
        agendamentosRecentes: `
            SELECT COUNT(*) as total FROM agendamento_simples 
            WHERE oficina_id = ? AND data_hora >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `,
        valorTotal: `
            SELECT COALESCE(SUM(total_servico), 0) as total FROM agendamento_simples 
            WHERE oficina_id = ? AND status = 'concluido'
            AND MONTH(data_hora) = MONTH(NOW()) AND YEAR(data_hora) = YEAR(NOW())
        `
    };

    const results = {};
    let completedQueries = 0;
    const totalQueries = Object.keys(queries).length;

    Object.keys(queries).forEach(key => {
        db.query(queries[key], [oficina_id], (err, result) => {
            if (err) {
                console.error(`Erro na query ${key}:`, err);
                results[key] = 0;
            } else {
                results[key] = result[0].total;
            }

            completedQueries++;
            if (completedQueries === totalQueries) {
                res.json({
                    success: true,
                    metrics: {
                        totalAgendamentos: results.totalAgendamentos,
                        agendamentosPendentes: results.agendamentosPendentes,
                        agendamentosConfirmados: results.agendamentosConfirmados,
                        agendamentosConcluidos: results.agendamentosConcluidos,
                        agendamentosRecentes: results.agendamentosRecentes,
                        valorTotal: parseFloat(results.valorTotal)
                    }
                });
            }
        });
    });
});

// Agendamentos por oficina
router.get('/agendamentos', checkOficinaAdmin, (req, res) => {
    const oficina_id = req.session.admin.oficina_id;
    const { status } = req.query;

    let query = `
        SELECT * FROM agendamento_simples 
        WHERE oficina_id = ?
    `;
    
    const params = [oficina_id];

    if (status && status !== 'todos') {
        query += ` AND status = ?`;
        params.push(status);
    }

    query += ` ORDER BY data_hora DESC`;

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Erro ao buscar agendamentos da oficina:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar agendamentos' 
            });
        }

        res.json({ 
            success: true, 
            agendamentos: results 
        });
    });
});

// Detalhes do agendamento
router.get('/agendamentos/:id', checkOficinaAdmin, (req, res) => {
    const { id } = req.params;
    const oficina_id = req.session.admin.oficina_id;

    const query = `
        SELECT * FROM agendamento_simples 
        WHERE id = ? AND oficina_id = ?
    `;

    db.query(query, [id, oficina_id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar agendamento:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar agendamento' 
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

// Atualizar status do agendamento
router.put('/agendamentos/:id', checkOficinaAdmin, (req, res) => {
    const { id } = req.params;
    const { status, motivo_cancelamento } = req.body;
    const oficina_id = req.session.admin.oficina_id;

    let query = `UPDATE agendamento_simples SET status = ?`;
    const params = [status];

    // Se for cancelamento, adicionar motivo e data
    if (status === 'cancelado' && motivo_cancelamento) {
        query += `, motivo_cancelamento = ?, data_cancelamento = NOW()`;
        params.push(motivo_cancelamento);
    }

    query += ` WHERE id = ? AND oficina_id = ?`;
    params.push(id, oficina_id);

    db.query(query, params, (err, result) => {
        if (err) {
            console.error('Erro ao atualizar agendamento:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao atualizar agendamento' 
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
            message: 'Status atualizado com sucesso!' 
        });
    });
});

// Adicionar protocolo ao agendamento
router.put('/agendamentos/:id/protocolo', checkOficinaAdmin, (req, res) => {
    const { id } = req.params;
    const { protocolo, status } = req.body;
    const oficina_id = req.session.admin.oficina_id;

    const query = `
        UPDATE agendamento_simples 
        SET protocolo_cliente = ?, status = ?
        WHERE id = ? AND oficina_id = ?
    `;

    db.query(query, [protocolo, status, id, oficina_id], (err, result) => {
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
            message: 'Protocolo adicionado com sucesso!' 
        });
    });
});

// Registrar divergência
// CORRIGIR a rota de divergência - garantir que o status seja 'divergencia'
router.put('/agendamentos/:id/divergencia', checkOficinaAdmin, (req, res) => {
    const { id } = req.params;
    const { divergencia } = req.body; // Remover status do body, sempre usar 'divergencia'
    const oficina_id = req.session.admin.oficina_id;

    console.log('📝 Registrando divergência para agendamento:', id);
    console.log('📝 Divergência:', divergencia);

    // SEMPRE definir status como 'divergencia'
    const query = `
        UPDATE agendamento_simples 
        SET divergencia = ?, 
            status = 'divergencia',
            data_divergencia = NOW()
        WHERE id = ? AND oficina_id = ?
    `;

    db.query(query, [divergencia, id, oficina_id], (err, result) => {
        if (err) {
            console.error('❌ Erro ao registrar divergência:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao registrar divergência' 
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Agendamento não encontrado' 
            });
        }

        console.log('✅ Divergência registrada com sucesso para agendamento:', id);
        
        res.json({ 
            success: true, 
            message: 'Divergência registrada com sucesso!' 
        });
    });
});
// CONCLUIR POR PROTOCOLO (OILxxxx) — permite que o admin conclua usando o protocolo mostrado na agenda do cliente
router.put('/agendamentos/concluir-por-protocolo', checkOficinaAdmin, (req, res) => {
    try {
        const { protocolo } = req.body;
        const oficina_id = req.session.admin.oficina_id;

        if (!protocolo || !protocolo.toString().trim()) {
            return res.status(400).json({ success: false, message: 'Protocolo é obrigatório' });
        }

        const protocoloTrim = protocolo.toString().trim();

        const query = `
            UPDATE agendamento_simples
            SET status = 'concluido', data_conclusao = NOW()
            WHERE protocolo = ? AND oficina_id = ?
        `;

        db.query(query, [protocoloTrim, oficina_id], (err, result) => {
            if (err) {
                console.error('Erro ao concluir por protocolo:', err);
                return res.status(500).json({ success: false, message: 'Erro ao concluir agendamento' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Protocolo não encontrado para sua oficina' });
            }

            return res.json({ success: true, message: 'Agendamento concluído com sucesso!' });
        });
    } catch (error) {
        console.error('Erro na rota concluir-por-protocolo:', error);
        res.status(500).json({ success: false, message: 'Erro interno' });
    }
});

// Concluir agendamento (quando o cliente fornecer o protocolo)
router.put('/agendamentos/:id/concluir', checkOficinaAdmin, (req, res) => {
    const { id } = req.params;
    const oficina_id = req.session.admin.oficina_id;

    const query = `
        UPDATE agendamento_simples 
        SET status = 'concluido', data_conclusao = NOW()
        WHERE id = ? AND oficina_id = ? AND protocolo_cliente IS NOT NULL
    `;

    db.query(query, [id, oficina_id], (err, result) => {
        if (err) {
            console.error('Erro ao concluir agendamento:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao concluir agendamento' 
            });
        }

        if (result.affectedRows === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Agendamento não encontrado ou sem protocolo definido' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Agendamento concluído com sucesso!' 
        });
    });
});

// Gerenciar Estoque
router.get('/estoque', checkOficinaAdmin, (req, res) => {
    const oficina_id = req.session.admin.oficina_id;

    const query = `
        SELECT * FROM estoque 
        WHERE oficina_id = ?
        ORDER BY nome_produto
    `;

    db.query(query, [oficina_id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar estoque:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar estoque' 
            });
        }

        res.json({ 
            success: true, 
            estoque: results 
        });
    });
});

// Adicionar produto ao estoque
router.post('/estoque', checkOficinaAdmin, (req, res) => {
    const oficina_id = req.session.admin.oficina_id;
    const { nome_produto, marca, tipo_produto, quantidade, preco } = req.body;

    const query = `
        INSERT INTO estoque (oficina_id, nome_produto, marca, tipo_produto, quantidade, preco)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [oficina_id, nome_produto, marca, tipo_produto, quantidade, preco], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar produto:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao adicionar produto' 
            });
        }

        res.status(201).json({ 
            success: true, 
            message: 'Produto adicionado com sucesso!',
            produto_id: result.insertId
        });
    });
});

// Atualizar estoque
router.put('/estoque/:id', checkOficinaAdmin, (req, res) => {
    const { id } = req.params;
    const { quantidade } = req.body;
    const oficina_id = req.session.admin.oficina_id;

    const query = `
        UPDATE estoque 
        SET quantidade = ? 
        WHERE id = ? AND oficina_id = ?
    `;

    db.query(query, [quantidade, id, oficina_id], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar estoque:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao atualizar estoque' 
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Produto não encontrado' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Estoque atualizado com sucesso!' 
        });
    });
});

// Remover produto do estoque
router.delete('/estoque/:id', checkOficinaAdmin, (req, res) => {
    const { id } = req.params;
    const oficina_id = req.session.admin.oficina_id;

    const query = `
        DELETE FROM estoque 
        WHERE id = ? AND oficina_id = ?
    `;

    db.query(query, [id, oficina_id], (err, result) => {
        if (err) {
            console.error('Erro ao remover produto:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao remover produto' 
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Produto não encontrado' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Produto removido com sucesso!' 
        });
    });
});

// adminRoutes.js - ADICIONAR ESTAS ROTAS

// Carregar configurações da oficina
router.get('/configuracoes', checkOficinaAdmin, (req, res) => {
    const oficina_id = req.session.admin.oficina_id;

    const query = `
        SELECT * FROM oficina 
        WHERE id = ?
    `;

    db.query(query, [oficina_id], (err, results) => {
        if (err) {
            console.error('Erro ao carregar configurações:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao carregar configurações' 
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
router.put('/configuracoes', checkOficinaAdmin, (req, res) => {
    const oficina_id = req.session.admin.oficina_id;
    const { 
        nome, 
        telefone, 
        endereco, 
        horario_abertura, 
        horario_fechamento, 
        dias_funcionamento 
    } = req.body;

    const query = `
        UPDATE oficina 
        SET nome = ?, telefone = ?, endereco = ?, 
            horario_abertura = ?, horario_fechamento = ?, dias_funcionamento = ?,
            updated_at = NOW()
        WHERE id = ?
    `;

    db.query(query, [
        nome, telefone, endereco, 
        horario_abertura, horario_fechamento, dias_funcionamento,
        oficina_id
    ], (err, result) => {
        if (err) {
            console.error('Erro ao salvar configurações:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao salvar configurações' 
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
            message: 'Configurações salvas com sucesso!' 
        });
    });
});

// Relatórios de agendamentos
router.get('/relatorios/agendamentos', checkOficinaAdmin, (req, res) => {
    const oficina_id = req.session.admin.oficina_id;
    const { data_inicio, data_fim } = req.query;

    let query = `
        SELECT 
            status,
            COUNT(*) as quantidade,
            COALESCE(SUM(total_servico), 0) as valor_total
        FROM agendamento_simples 
        WHERE oficina_id = ?
    `;

    const params = [oficina_id];

    if (data_inicio && data_fim) {
        query += ` AND DATE(data_hora) BETWEEN ? AND ?`;
        params.push(data_inicio, data_fim);
    }

    query += ` GROUP BY status ORDER BY status`;

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Erro ao gerar relatório:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao gerar relatório' 
            });
        }

        res.json({ 
            success: true, 
            relatorio: results 
        });
    });
});

module.exports = router;