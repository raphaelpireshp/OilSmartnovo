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


// ==================== ROTAS DE GESTÃO DE ESTOQUE AVANÇADA ====================

// Buscar estoque com filtros
router.get('/estoque', checkOficinaAdmin, (req, res) => {
    const oficina_id = req.session.admin.oficina_id;
    const { tipo, marca_veiculo, status } = req.query;

    let query = `
        SELECT 
            e.*,
            CASE 
                WHEN e.tipo_produto = 'oleo' THEN po.nome
                WHEN e.tipo_produto = 'filtro' THEN pf.nome
            END as nome_produto,
            CASE 
                WHEN e.tipo_produto = 'oleo' THEN po.marca
                WHEN e.tipo_produto = 'filtro' THEN pf.marca
            END as marca,
            CASE 
                WHEN e.tipo_produto = 'oleo' THEN po.tipo
                WHEN e.tipo_produto = 'filtro' THEN pf.tipo
            END as tipo_veiculo,
            CONCAT(m.nome, ' ', mo.nome, ' ', ma.ano) as compatibilidade_veiculo
        FROM estoque e
        LEFT JOIN produto_oleo po ON e.tipo_produto = 'oleo' AND e.produto_id = po.id
        LEFT JOIN produto_filtro pf ON e.tipo_produto = 'filtro' AND e.produto_id = pf.id
        LEFT JOIN modelo_ano ma ON e.modelo_ano_id = ma.id
        LEFT JOIN modelo mo ON ma.modelo_id = mo.id
        LEFT JOIN marca m ON mo.marca_id = m.id
        WHERE e.oficina_id = ?
    `;

    const params = [oficina_id];

    // Aplicar filtros
    if (tipo && tipo !== 'todos') {
        query += ' AND e.tipo_produto = ?';
        params.push(tipo);
    }

    if (marca_veiculo && marca_veiculo !== 'todos') {
        query += ' AND m.id = ?';
        params.push(marca_veiculo);
    }

    if (status && status !== 'todos') {
        if (status === 'ativo') {
            query += ' AND e.ativo = 1';
        } else if (status === 'inativo') {
            query += ' AND e.ativo = 0';
        }
    }

    query += ' ORDER BY e.data_cadastro DESC';

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Erro ao buscar estoque:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        // Buscar marcas para o filtro
        db.query('SELECT id, nome FROM marca ORDER BY nome', (errMarca, marcas) => {
            if (errMarca) {
                console.error('Erro ao buscar marcas:', errMarca);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro interno do servidor' 
                });
            }

            res.json({
                success: true,
                estoque: results,
                marcas: marcas
            });
        });
    });
});

// Buscar marcas
router.get('/marcas', checkOficinaAdmin, (req, res) => {
    const query = `
        SELECT m.*, 
               COUNT(DISTINCT mo.id) as total_modelos
        FROM marca m
        LEFT JOIN modelo mo ON m.id = mo.marca_id
        GROUP BY m.id
        ORDER BY m.nome
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar marcas:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        res.json({
            success: true,
            marcas: results
        });
    });
});

// Buscar modelos por marca
router.get('/modelos', checkOficinaAdmin, (req, res) => {
    const { marca_id } = req.query;

    if (!marca_id) {
        return res.status(400).json({
            success: false,
            message: 'ID da marca é obrigatório'
        });
    }

    const query = `
        SELECT id, nome, tipo 
        FROM modelo 
        WHERE marca_id = ? 
        ORDER BY nome
    `;

    db.query(query, [marca_id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar modelos:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        res.json({
            success: true,
            modelos: results
        });
    });
});

// Buscar anos por modelo
router.get('/modelo_anos', checkOficinaAdmin, (req, res) => {
    const { modelo_id } = req.query;

    if (!modelo_id) {
        return res.status(400).json({
            success: false,
            message: 'ID do modelo é obrigatório'
        });
    }

    const query = `
        SELECT id, ano 
        FROM modelo_ano 
        WHERE modelo_id = ? 
        ORDER BY ano DESC
    `;

    db.query(query, [modelo_id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar anos:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        res.json({
            success: true,
            anos: results
        });
    });
});

// Buscar óleos disponíveis
router.get('/produtos/oleos', checkOficinaAdmin, (req, res) => {
    const query = `
        SELECT id, nome, marca, tipo, viscosidade, especificacao, preco
        FROM produto_oleo 
        ORDER BY nome
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar óleos:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        res.json({
            success: true,
            produtos: results
        });
    });
});

// Buscar filtros disponíveis
router.get('/produtos/filtros', checkOficinaAdmin, (req, res) => {
    const query = `
        SELECT id, nome, marca, tipo, compatibilidade_modelo, preco
        FROM produto_filtro 
        ORDER BY nome
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar filtros:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        res.json({
            success: true,
            produtos: results
        });
    });
});

// Adicionar produto por veículo
router.post('/estoque/veiculo', checkOficinaAdmin, (req, res) => {
    const oficina_id = req.session.admin.oficina_id;
    const { produto_id, tipo_produto, quantidade, quantidade_minima, preco, modelo_ano_id } = req.body;

    // Validações
    if (!produto_id || !tipo_produto || !quantidade || !preco || !modelo_ano_id) {
        return res.status(400).json({
            success: false,
            message: 'Todos os campos obrigatórios devem ser preenchidos'
        });
    }

    // Verificar se já existe estoque para este produto e veículo
    const checkQuery = `
        SELECT id FROM estoque 
        WHERE oficina_id = ? AND produto_id = ? AND tipo_produto = ? AND modelo_ano_id = ?
    `;

    db.query(checkQuery, [oficina_id, produto_id, tipo_produto, modelo_ano_id], (err, results) => {
        if (err) {
            console.error('Erro ao verificar estoque:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        if (results.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Já existe estoque para este produto e veículo'
            });
        }

        // Inserir novo estoque
        const insertQuery = `
            INSERT INTO estoque 
            (oficina_id, produto_id, tipo_produto, quantidade, quantidade_minima, preco, modelo_ano_id, ativo)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `;

        db.query(insertQuery, [
            oficina_id, produto_id, tipo_produto, quantidade, quantidade_minima, preco, modelo_ano_id
        ], (err, results) => {
            if (err) {
                console.error('Erro ao adicionar estoque:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro interno do servidor' 
                });
            }

            res.json({
                success: true,
                message: 'Produto adicionado ao estoque com sucesso!'
            });
        });
    });
});

// Alternar status do produto
router.put('/estoque/:id/status', checkOficinaAdmin, (req, res) => {
    const { id } = req.params;
    const { ativo } = req.body;
    const oficina_id = req.session.admin.oficina_id;

    const query = `
        UPDATE estoque 
        SET ativo = ?, data_atualizacao = NOW() 
        WHERE id = ? AND oficina_id = ?
    `;

    db.query(query, [ativo ? 1 : 0, id, oficina_id], (err, results) => {
        if (err) {
            console.error('Erro ao atualizar status do estoque:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Produto não encontrado'
            });
        }

        res.json({
            success: true,
            message: `Produto ${ativo ? 'ativado' : 'desativado'} com sucesso!`
        });
    });
});

// Buscar detalhes do produto
router.get('/estoque/:id/detalhes', checkOficinaAdmin, (req, res) => {
    const { id } = req.params;
    const oficina_id = req.session.admin.oficina_id;

    const query = `
        SELECT 
            e.*,
            CASE 
                WHEN e.tipo_produto = 'oleo' THEN po.nome
                WHEN e.tipo_produto = 'filtro' THEN pf.nome
            END as nome_produto,
            CASE 
                WHEN e.tipo_produto = 'oleo' THEN po.marca
                WHEN e.tipo_produto = 'filtro' THEN pf.marca
            END as marca,
            CASE 
                WHEN e.tipo_produto = 'oleo' THEN po.tipo
                WHEN e.tipo_produto = 'filtro' THEN pf.tipo
            END as tipo_veiculo,
            CONCAT(m.nome, ' ', mo.nome, ' ', ma.ano) as compatibilidade_veiculo,
            po.viscosidade,
            po.especificacao,
            pf.compatibilidade_modelo
        FROM estoque e
        LEFT JOIN produto_oleo po ON e.tipo_produto = 'oleo' AND e.produto_id = po.id
        LEFT JOIN produto_filtro pf ON e.tipo_produto = 'filtro' AND e.produto_id = pf.id
        LEFT JOIN modelo_ano ma ON e.modelo_ano_id = ma.id
        LEFT JOIN modelo mo ON ma.modelo_id = mo.id
        LEFT JOIN marca m ON mo.marca_id = m.id
        WHERE e.id = ? AND e.oficina_id = ?
    `;

    db.query(query, [id, oficina_id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar detalhes do produto:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Produto não encontrado'
            });
        }

        res.json({
            success: true,
            produto: results[0]
        });
    });
});

// Buscar modelos completos (com informações da marca)
router.get('/modelos-completos', checkOficinaAdmin, (req, res) => {
    const query = `
        SELECT 
            mo.id,
            mo.nome,
            mo.tipo,
            m.nome as marca_nome,
            COUNT(DISTINCT ma.id) as total_anos
        FROM modelo mo
        LEFT JOIN marca m ON mo.marca_id = m.id
        LEFT JOIN modelo_ano ma ON mo.id = ma.modelo_id
        GROUP BY mo.id
        ORDER BY m.nome, mo.nome
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar modelos completos:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        res.json({
            success: true,
            modelos: results
        });
    });
});

// Buscar anos completos (com informações do modelo e marca)
router.get('/modelo_anos-completos', checkOficinaAdmin, (req, res) => {
    const query = `
        SELECT 
            ma.id,
            ma.ano,
            mo.nome as modelo_nome,
            m.nome as marca_nome,
            mo.tipo
        FROM modelo_ano ma
        LEFT JOIN modelo mo ON ma.modelo_id = mo.id
        LEFT JOIN marca m ON mo.marca_id = m.id
        ORDER BY m.nome, mo.nome, ma.ano DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar anos completos:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        res.json({
            success: true,
            anos: results
        });
    });
});

// Adicionar nova marca
router.post('/marcas', checkOficinaAdmin, (req, res) => {
    const { nome } = req.body;

    if (!nome) {
        return res.status(400).json({
            success: false,
            message: 'Nome da marca é obrigatório'
        });
    }

    // Verificar se a marca já existe
    const checkQuery = 'SELECT id FROM marca WHERE nome = ?';
    
    db.query(checkQuery, [nome.trim()], (err, results) => {
        if (err) {
            console.error('Erro ao verificar marca:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        if (results.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Esta marca já existe'
            });
        }

        // Inserir nova marca
        const insertQuery = 'INSERT INTO marca (nome) VALUES (?)';
        
        db.query(insertQuery, [nome.trim()], (err, results) => {
            if (err) {
                console.error('Erro ao adicionar marca:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro interno do servidor' 
                });
            }

            res.json({
                success: true,
                message: 'Marca adicionada com sucesso!',
                marca_id: results.insertId
            });
        });
    });
});

// adminRoutes.js - ADICIONAR ESTAS ROTAS PARA ESTOQUE POR VEÍCULO

// Adicionar produto simples (óleo ou filtro)
router.post('/estoque/produto-simples', checkOficinaAdmin, (req, res) => {
    const oficina_id = req.session.admin.oficina_id;
    const { nome, tipo, marca, preco, especificacao, viscosidade, compatibilidade_modelo } = req.body;

    if (!nome || !tipo || !preco) {
        return res.status(400).json({
            success: false,
            message: 'Nome, tipo e preço são obrigatórios'
        });
    }

    if (tipo === 'oleo') {
        const query = `
            INSERT INTO produto_oleo (nome, tipo, marca, preco, viscosidade, especificacao)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        db.query(query, [nome, 'carro', marca, preco, viscosidade, especificacao], (err, result) => {
            if (err) {
                console.error('Erro ao adicionar óleo:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro ao adicionar óleo' 
                });
            }

            res.json({
                success: true,
                message: 'Óleo adicionado com sucesso!',
                produto_id: result.insertId
            });
        });
    } else if (tipo === 'filtro') {
        const query = `
            INSERT INTO produto_filtro (nome, tipo, marca, preco, compatibilidade_modelo)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        db.query(query, [nome, 'carro', marca, preco, compatibilidade_modelo], (err, result) => {
            if (err) {
                console.error('Erro ao adicionar filtro:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro ao adicionar filtro' 
                });
            }

            res.json({
                success: true,
                message: 'Filtro adicionado com sucesso!',
                produto_id: result.insertId
            });
        });
    } else {
        return res.status(400).json({
            success: false,
            message: 'Tipo de produto inválido'
        });
    }
});

// Adicionar produto por veículo específico
router.post('/estoque/produto-veiculo', checkOficinaAdmin, (req, res) => {
    const oficina_id = req.session.admin.oficina_id;
    const { produto_id, tipo_produto, modelo_ano_id, preco } = req.body;

    if (!produto_id || !tipo_produto || !modelo_ano_id || !preco) {
        return res.status(400).json({
            success: false,
            message: 'Todos os campos são obrigatórios'
        });
    }

    // Verificar se já existe estoque para este produto e veículo
    const checkQuery = `
        SELECT id FROM estoque 
        WHERE oficina_id = ? AND produto_id = ? AND tipo_produto = ? AND modelo_ano_id = ?
    `;

    db.query(checkQuery, [oficina_id, produto_id, tipo_produto, modelo_ano_id], (err, results) => {
        if (err) {
            console.error('Erro ao verificar estoque:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        if (results.length > 0) {
            // Atualizar preço se já existe
            const updateQuery = `
                UPDATE estoque 
                SET preco = ?, ativo = 1, data_atualizacao = NOW()
                WHERE id = ?
            `;
            
            db.query(updateQuery, [preco, results[0].id], (err, result) => {
                if (err) {
                    console.error('Erro ao atualizar produto:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Erro ao atualizar produto' 
                    });
                }

                res.json({
                    success: true,
                    message: 'Produto atualizado com sucesso!'
                });
            });
        } else {
            // Inserir novo estoque
            const insertQuery = `
                INSERT INTO estoque 
                (oficina_id, produto_id, tipo_produto, modelo_ano_id, preco, ativo)
                VALUES (?, ?, ?, ?, ?, 1)
            `;

            db.query(insertQuery, [
                oficina_id, produto_id, tipo_produto, modelo_ano_id, preco
            ], (err, results) => {
                if (err) {
                    console.error('Erro ao adicionar estoque:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Erro interno do servidor' 
                    });
                }

                res.json({
                    success: true,
                    message: 'Produto adicionado ao estoque com sucesso!'
                });
            });
        }
    });
});

// Adicionar nova marca
router.post('/marcas', checkOficinaAdmin, (req, res) => {
    const { nome } = req.body;

    if (!nome) {
        return res.status(400).json({
            success: false,
            message: 'Nome da marca é obrigatório'
        });
    }

    // Verificar se a marca já existe
    const checkQuery = 'SELECT id FROM marca WHERE nome = ?';
    
    db.query(checkQuery, [nome.trim()], (err, results) => {
        if (err) {
            console.error('Erro ao verificar marca:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        if (results.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Esta marca já existe'
            });
        }

        // Inserir nova marca
        const insertQuery = 'INSERT INTO marca (nome) VALUES (?)';
        
        db.query(insertQuery, [nome.trim()], (err, results) => {
            if (err) {
                console.error('Erro ao adicionar marca:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro interno do servidor' 
                });
            }

            res.json({
                success: true,
                message: 'Marca adicionada com sucesso!',
                marca_id: results.insertId
            });
        });
    });
});

// Adicionar novo modelo
router.post('/modelos', checkOficinaAdmin, (req, res) => {
    const { nome, marca_id, tipo } = req.body;

    if (!nome || !marca_id || !tipo) {
        return res.status(400).json({
            success: false,
            message: 'Nome, marca e tipo são obrigatórios'
        });
    }

    // Verificar se o modelo já existe para esta marca
    const checkQuery = 'SELECT id FROM modelo WHERE nome = ? AND marca_id = ?';
    
    db.query(checkQuery, [nome.trim(), marca_id], (err, results) => {
        if (err) {
            console.error('Erro ao verificar modelo:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        if (results.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Este modelo já existe para esta marca'
            });
        }

        // Inserir novo modelo
        const insertQuery = 'INSERT INTO modelo (nome, marca_id, tipo) VALUES (?, ?, ?)';
        
        db.query(insertQuery, [nome.trim(), marca_id, tipo], (err, results) => {
            if (err) {
                console.error('Erro ao adicionar modelo:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro interno do servidor' 
                });
            }

            res.json({
                success: true,
                message: 'Modelo adicionado com sucesso!',
                modelo_id: results.insertId
            });
        });
    });
});

// Adicionar novo ano para modelo
router.post('/modelo_anos', checkOficinaAdmin, (req, res) => {
    const { modelo_id, ano } = req.body;

    if (!modelo_id || !ano) {
        return res.status(400).json({
            success: false,
            message: 'Modelo e ano são obrigatórios'
        });
    }

    // Verificar se o ano já existe para este modelo
    const checkQuery = 'SELECT id FROM modelo_ano WHERE modelo_id = ? AND ano = ?';
    
    db.query(checkQuery, [modelo_id, ano], (err, results) => {
        if (err) {
            console.error('Erro ao verificar ano:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        if (results.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Este ano já existe para este modelo'
            });
        }

        // Inserir novo ano
        const insertQuery = 'INSERT INTO modelo_ano (modelo_id, ano) VALUES (?, ?)';
        
        db.query(insertQuery, [modelo_id, ano], (err, results) => {
            if (err) {
                console.error('Erro ao adicionar ano:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro interno do servidor' 
                });
            }

            res.json({
                success: true,
                message: 'Ano adicionado com sucesso!',
                ano_id: results.insertId
            });
        });
    });
});

// Buscar produtos por tipo (óleos ou filtros)
router.get('/produtos/:tipo', checkOficinaAdmin, (req, res) => {
    const { tipo } = req.params;

    if (tipo === 'oleos') {
        const query = 'SELECT id, nome, marca, tipo, viscosidade, especificacao, preco FROM produto_oleo ORDER BY nome';
        db.query(query, (err, results) => {
            if (err) {
                console.error('Erro ao buscar óleos:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro interno do servidor' 
                });
            }
            res.json({ success: true, produtos: results });
        });
    } else if (tipo === 'filtros') {
        const query = 'SELECT id, nome, marca, tipo, compatibilidade_modelo, preco FROM produto_filtro ORDER BY nome';
        db.query(query, (err, results) => {
            if (err) {
                console.error('Erro ao buscar filtros:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro interno do servidor' 
                });
            }
            res.json({ success: true, produtos: results });
        });
    } else {
        return res.status(400).json({
            success: false,
            message: 'Tipo de produto inválido'
        });
    }
});

// Buscar estoque da oficina com informações completas
router.get('/estoque/completo', checkOficinaAdmin, (req, res) => {
    const oficina_id = req.session.admin.oficina_id;

    const query = `
        SELECT 
            e.id,
            e.produto_id,
            e.tipo_produto,
            e.preco,
            e.ativo,
            e.data_cadastro,
            CASE 
                WHEN e.tipo_produto = 'oleo' THEN po.nome
                WHEN e.tipo_produto = 'filtro' THEN pf.nome
            END as nome_produto,
            CASE 
                WHEN e.tipo_produto = 'oleo' THEN po.marca
                WHEN e.tipo_produto = 'filtro' THEN pf.marca
            END as marca_produto,
            m.nome as marca_veiculo,
            mo.nome as modelo_veiculo,
            ma.ano as ano_veiculo,
            CONCAT(m.nome, ' ', mo.nome, ' ', ma.ano) as veiculo_completo
        FROM estoque e
        LEFT JOIN produto_oleo po ON e.tipo_produto = 'oleo' AND e.produto_id = po.id
        LEFT JOIN produto_filtro pf ON e.tipo_produto = 'filtro' AND e.produto_id = pf.id
        LEFT JOIN modelo_ano ma ON e.modelo_ano_id = ma.id
        LEFT JOIN modelo mo ON ma.modelo_id = mo.id
        LEFT JOIN marca m ON mo.marca_id = m.id
        WHERE e.oficina_id = ?
        ORDER BY e.data_cadastro DESC
    `;

    db.query(query, [oficina_id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar estoque completo:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        res.json({
            success: true,
            estoque: results
        });
    });
});

// Alternar status do produto (ativo/inativo)
router.put('/estoque/:id/status', checkOficinaAdmin, (req, res) => {
    const { id } = req.params;
    const { ativo } = req.body;
    const oficina_id = req.session.admin.oficina_id;

    const query = `
        UPDATE estoque 
        SET ativo = ?, data_atualizacao = NOW() 
        WHERE id = ? AND oficina_id = ?
    `;

    db.query(query, [ativo ? 1 : 0, id, oficina_id], (err, results) => {
        if (err) {
            console.error('Erro ao atualizar status do estoque:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Produto não encontrado'
            });
        }

        res.json({
            success: true,
            message: `Produto ${ativo ? 'ativado' : 'desativado'} com sucesso!`
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

    db.query(query, [id, oficina_id], (err, results) => {
        if (err) {
            console.error('Erro ao remover produto:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        if (results.affectedRows === 0) {
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