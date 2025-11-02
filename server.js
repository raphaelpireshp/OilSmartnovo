const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuração de sessão
app.use(session({
    secret: process.env.SESSION_SECRET || 'oilsmart_secret_key_2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Para desenvolvimento local
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Conexão com banco
const db = require('./database/db');

// Middleware de autenticação para admins
function requireAdminAuth(req, res, next) {
    if (!req.session.admin) {
        return res.status(401).json({ 
            success: false, 
            message: 'Acesso não autorizado' 
        });
    }
    next();
}


// Rotas de autenticação administrativa
app.post('/api/admin/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email e senha são obrigatórios' 
        });
    }

    try {
        // Buscar oficina pelo email do usuário
        const query = `
            SELECT u.*, o.id as oficina_id, o.nome as oficina_nome
            FROM usuario u
            JOIN oficina o ON u.id = o.usuario_id
            WHERE u.email = ? AND u.tipo = 'oficina'
        `;
        
        db.query(query, [email], async (err, results) => {
            if (err) {
                console.error('Erro no login:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro interno do servidor' 
                });
            }

            if (results.length === 0) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Credenciais inválidas' 
                });
            }

            const admin = results[0];
            
            // Verificar senha
            const senhaValida = await bcrypt.compare(senha, admin.senha);
            
            if (!senhaValida) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Credenciais inválidas' 
                });
            }

            // Criar sessão
            req.session.admin = {
                id: admin.id,
                nome: admin.nome,
                email: admin.email,
                oficina_id: admin.oficina_id,
                oficina_nome: admin.oficina_nome
            };

            res.json({
                success: true,
                message: 'Login realizado com sucesso',
                admin: req.session.admin
            });
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
    }
});

// ==================== ROTA PARA HORÁRIOS ESPECIAIS - CLIENTE ====================

// Rota para cliente verificar horário especial em uma data específica
app.get('/api/oficina/:id/horario-especial/:data', (req, res) => {
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
app.get('/api/oficina/:id/capacidade', (req, res) => {
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

app.post('/api/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao fazer logout' 
            });
        }
        res.json({ 
            success: true, 
            message: 'Logout realizado com sucesso' 
        });
    });
});

app.get('/api/admin/check-auth', (req, res) => {
    if (req.session.admin) {
        res.json({
            success: true,
            admin: req.session.admin
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Não autenticado'
        });
    }
});

// ========== ROTAS ESPECÍFICAS (DEVEM VIR ANTES DAS ROTAS COM :id) ==========

// Rota para concluir agendamento pelo protocolo "OILxxxx" - CORRIGIDA
app.put('/api/admin/agendamentos/concluir-por-protocolo', requireAdminAuth, (req, res) => {
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
app.put('/api/admin/agendamentos/:id/concluir', requireAdminAuth, (req, res) => {
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
app.put('/api/admin/concluir-protocolo', requireAdminAuth, (req, res) => {
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

// ========== ROTAS DE CONFIGURAÇÕES DA OFICINA ==========









// ========== ROTAS ADICIONAIS PARA O SISTEMA DE AGENDAMENTO ==========



// Rota para buscar todas as oficinas com informações completas
app.get('/api/oficinas-completas', (req, res) => {
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
app.get("/api/oficina/:id/config", (req, res) => {
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

app.put('/api/admin/oficina/coordenadas', requireAdminAuth, (req, res) => {
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

// ========== ROTAS ADMINISTRATIVAS PRINCIPAIS ==========

// Dashboard
app.get('/api/admin/dashboard', requireAdminAuth, (req, res) => {
    const oficinaId = req.session.admin.oficina_id;
    
    // Métricas do dashboard para a oficina específica
    const queries = {
        totalAgendamentos: `
            SELECT COUNT(*) as total 
            FROM agendamento_simples 
            WHERE oficina_id = ?
        `,
        agendamentosPendentes: `
            SELECT COUNT(*) as total 
            FROM agendamento_simples 
            WHERE oficina_id = ? AND status = 'pendente'
        `,
        agendamentosConfirmados: `
            SELECT COUNT(*) as total 
            FROM agendamento_simples 
            WHERE oficina_id = ? AND status = 'confirmado'
        `,
        agendamentosConcluidos: `
            SELECT COUNT(*) as total 
            FROM agendamento_simples 
            WHERE oficina_id = ? AND status = 'concluido'
        `,
        agendamentosRecentes: `
            SELECT COUNT(*) as total 
            FROM agendamento_simples 
            WHERE oficina_id = ? AND data_hora >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `,
        valorTotal: `
            SELECT COALESCE(SUM(total_servico), 0) as total 
            FROM agendamento_simples 
            WHERE oficina_id = ? AND status = 'concluido' 
            AND MONTH(data_hora) = MONTH(NOW()) 
            AND YEAR(data_hora) = YEAR(NOW())
        `
    };

    const metrics = {};
    let completedQueries = 0;
    const totalQueries = Object.keys(queries).length;

    Object.entries(queries).forEach(([key, query]) => {
        db.query(query, [oficinaId], (err, results) => {
            if (err) {
                console.error(`Erro na query ${key}:`, err);
                metrics[key] = 0;
            } else {
                metrics[key] = results[0].total || 0;
            }
            
            completedQueries++;
            if (completedQueries === totalQueries) {
                res.json({
                    success: true,
                    metrics: {
                        totalAgendamentos: metrics.totalAgendamentos,
                        agendamentosPendentes: metrics.agendamentosPendentes,
                        agendamentosConfirmados: metrics.agendamentosConfirmados,
                        agendamentosConcluidos: metrics.agendamentosConcluidos,
                        agendamentosRecentes: metrics.agendamentosRecentes,
                        valorTotal: parseFloat(metrics.valorTotal)
                    }
                });
            }
        });
    });
});

// Listar agendamentos
app.get('/api/admin/agendamentos', requireAdminAuth, (req, res) => {
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
app.get('/api/admin/agendamentos/:id', requireAdminAuth, (req, res) => {
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
app.put('/api/admin/agendamentos/:id', requireAdminAuth, (req, res) => {
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
app.put('/api/admin/agendamentos/:id/protocolo', requireAdminAuth, (req, res) => {
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
app.put('/api/admin/agendamentos/:id/divergencia', requireAdminAuth, (req, res) => {
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
app.put('/api/admin/agendamentos/:id/cancelar', requireAdminAuth, (req, res) => {
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
app.get('/api/admin/debug/protocolos', requireAdminAuth, (req, res) => {
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
app.get('/api/admin/estoque', requireAdminAuth, (req, res) => {
    const oficinaId = req.session.admin.oficina_id;
    
    const query = `
        SELECT e.*, 
               CASE 
                   WHEN e.tipo_produto = 'oleo' THEN po.nome
                   WHEN e.tipo_produto = 'filtro' THEN pf.nome
               END as nome_produto,
               CASE 
                   WHEN e.tipo_produto = 'oleo' THEN po.marca
                   WHEN e.tipo_produto = 'filtro' THEN 'Filtro'
               END as marca,
               CASE 
                   WHEN e.tipo_produto = 'oleo' THEN po.preco
                   WHEN e.tipo_produto = 'filtro' THEN pf.preco
               END as preco
        FROM estoque e
        LEFT JOIN produto_oleo po ON e.tipo_produto = 'oleo' AND e.produto_id = po.id
        LEFT JOIN produto_filtro pf ON e.tipo_produto = 'filtro' AND e.produto_id = pf.id
        WHERE e.oficina_id = ?
        ORDER BY e.tipo_produto, nome_produto
    `;
    
    db.query(query, [oficinaId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar estoque:', err);
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

// Atualizar estoque
app.put('/api/admin/estoque/:id', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const { quantidade } = req.body;
    const oficinaId = req.session.admin.oficina_id;
    
    const query = `
        UPDATE estoque 
        SET quantidade = ? 
        WHERE id = ? AND oficina_id = ?
    `;
    
    db.query(query, [quantidade, id, oficinaId], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar estoque:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Item não encontrado' 
            });
        }
        
        res.json({
            success: true,
            message: 'Estoque atualizado com sucesso'
        });
    });
});

// Relatórios
app.get('/api/admin/relatorios/agendamentos', requireAdminAuth, (req, res) => {
    const oficinaId = req.session.admin.oficina_id;
    const { data_inicio, data_fim } = req.query;
    
    let query = `
        SELECT 
            status,
            COUNT(*) as quantidade,
            SUM(total_servico) as valor_total
        FROM agendamento_simples 
        WHERE oficina_id = ?
    `;
    
    const params = [oficinaId];
    
    if (data_inicio && data_fim) {
        query += ' AND DATE(data_hora) BETWEEN ? AND ?';
        params.push(data_inicio, data_fim);
    }
    
    query += ' GROUP BY status ORDER BY status';
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Erro ao gerar relatório:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }
        
        res.json({
            success: true,
            relatorio: results
        });
    });
});

// ========== IMPORTAR E USAR OUTRAS ROTAS ==========

// Importar rotas existentes
const authRoutes = require('./routes/auth');
const agendamentoSimplesRoutes = require('./routes/agendamentoSimples');
const oficinaRoutes = require('./routes/oficina');
const veiculoRoutes = require('./routes/veiculo');
const marcaRoutes = require('./routes/marca');
const modeloRoutes = require('./routes/modelo');
const modeloAnoRoutes = require('./routes/modeloAno');
const recomendacaoRoutes = require('./routes/recomendacao');
const geocodeRoutes = require('./routes/geocode');
const lembreteTrocaOleoRoutes = require('./routes/lembreteTrocaOleo');

// Usar rotas
app.use('/api/auth', authRoutes);
app.use('/api/oficina', oficinaRoutes);
app.use('/api/veiculos', veiculoRoutes);
app.use('/api/marcas', marcaRoutes);
app.use('/api/modelos', modeloRoutes);
app.use('/api/modelo_anos', modeloAnoRoutes);
app.use('/api/recomendacoes', recomendacaoRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/contact', require('./routes/contact'));
app.use('/api/agendamento_simples', agendamentoSimplesRoutes);
app.use('/api/email', require('./routes/email'));

app.use('/api/lembretes_troca_oleo', lembreteTrocaOleoRoutes);

// ========== NOVAS ROTAS PARA ADMIN GERAL ==========

// Rota para obter produtos (óleos e filtros) - ADICIONE AQUI
app.get('/api/produtos/oleo', (req, res) => {
    const sql = 'SELECT * FROM produto_oleo ORDER BY nome';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar óleos:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json(results);
    });
});

app.get('/api/produtos/filtro', (req, res) => {
    const sql = 'SELECT * FROM produto_filtro ORDER BY nome';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar filtros:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json(results);
    });
});

// Rota para adicionar óleo - ADICIONE AQUI
app.post('/api/produtos/oleo', (req, res) => {
    const { nome, tipo, viscosidade, especificacao, marca, preco } = req.body;
    
    const sql = `
        INSERT INTO produto_oleo (nome, tipo, viscosidade, especificacao, marca, preco)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    db.query(sql, [nome, tipo, viscosidade, especificacao, marca, preco], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar óleo:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json({ success: true, id: result.insertId, message: 'Óleo adicionado com sucesso' });
    });
});

// Rota para adicionar filtro - ADICIONE AQUI
app.post('/api/produtos/filtro', (req, res) => {
    const { nome, tipo, compatibilidade_modelo, preco } = req.body;
    
    const sql = `
        INSERT INTO produto_filtro (nome, tipo, compatibilidade_modelo, preco)
        VALUES (?, ?, ?, ?)
    `;
    
    db.query(sql, [nome, tipo, compatibilidade_modelo, preco], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar filtro:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json({ success: true, id: result.insertId, message: 'Filtro adicionado com sucesso' });
    });
});

// Rota para obter modelos completos (com nome da marca) - ADICIONE AQUI
app.get('/api/modelos-completos', (req, res) => {
    const sql = `
        SELECT 
            m.id as id_modelo,
            m.nome as nome_modelo,
            m.tipo,
            ma.id as id_marca,
            ma.nome as nome_marca
        FROM modelo m
        JOIN marca ma ON m.marca_id = ma.id
        ORDER BY ma.nome, m.nome
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar modelos completos:', err);
            return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
        res.json({ success: true, data: results });
    });
});

// Rota para obter anos completos (com nome do modelo e marca) - ADICIONE AQUI
app.get('/api/anos-completos', (req, res) => {
    const sql = `
        SELECT 
            ma.id as id_ano,
            ma.ano,
            m.id as id_modelo,
            m.nome as nome_modelo,
            m.tipo,
            mar.id as id_marca,
            mar.nome as nome_marca
        FROM modelo_ano ma
        JOIN modelo m ON ma.modelo_id = m.id
        JOIN marca mar ON m.marca_id = mar.id
        ORDER BY mar.nome, m.nome, ma.ano
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar anos completos:', err);
            return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
        res.json({ success: true, data: results });
    });
});
// ========== ROTA PARA ADICIONAR OFICINA ==========

// Rota para adicionar oficina - VERSÃO CORRIGIDA
app.post('/api/oficina', async (req, res) => {
    const {
        nome, email, senha, endereco, cidade, estado, telefone, horario_abertura,
        horario_fechamento, dias_funcionamento, lat, lng, cep
    } = req.body;

    console.log('📝 Dados recebidos para nova oficina:', req.body);

    // Validação dos campos obrigatórios
    if (!nome || !email || !senha || !endereco || !cidade || !estado || !telefone || !cep) {
        return res.status(400).json({ 
            success: false, 
            error: 'Campos obrigatórios faltando: nome, email, senha, endereco, cidade, estado, telefone, cep' 
        });
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            success: false, 
            error: 'Email inválido' 
        });
    }

    // Validação de latitude e longitude - mais robusta
    if (lat !== undefined && lat !== null && lat !== '') {
        const latNum = parseFloat(lat);
        if (isNaN(latNum) || latNum < -90 || latNum > 90) {
            return res.status(400).json({ 
                success: false, 
                error: 'Latitude deve ser um número entre -90 e 90' 
            });
        }
    }

    if (lng !== undefined && lng !== null && lng !== '') {
        const lngNum = parseFloat(lng);
        if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
            return res.status(400).json({ 
                success: false, 
                error: 'Longitude deve ser um número entre -180 e 180' 
            });
        }
    }

    // Validação de CEP
    if (cep.length < 8) {
        return res.status(400).json({ 
            success: false, 
            error: 'CEP deve ter pelo menos 8 caracteres' 
        });
    }

    // Validação de telefone
    const telefoneLimpo = telefone.replace(/\D/g, '');
    if (telefoneLimpo.length < 10) {
        return res.status(400).json({ 
            success: false, 
            error: 'Telefone deve ter pelo menos 10 dígitos' 
        });
    }

    try {
        // Primeiro verificar se o email já existe
        const checkEmailQuery = 'SELECT id FROM usuario WHERE email = ?';
        const emailResults = await new Promise((resolve, reject) => {
            db.query(checkEmailQuery, [email], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        if (emailResults.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email já está em uso. Por favor, use outro email.' 
            });
        }

        // Criar o usuário para a oficina
        const usuarioSql = `
            INSERT INTO usuario (nome, email, senha, tipo) 
            VALUES (?, ?, ?, 'oficina')
        `;
        
        // Hash da senha
        const bcrypt = require('bcryptjs');
        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);

        const usuarioResult = await new Promise((resolve, reject) => {
            db.query(usuarioSql, [nome, email, senhaHash], (err, result) => {
                if (err) {
                    // Tratamento específico para erro de email duplicado
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ 
                            success: false, 
                            error: 'Email já está em uso. Por favor, use outro email.' 
                        });
                    }
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        const usuarioId = usuarioResult.insertId;
        console.log('✅ Usuário criado com ID:', usuarioId);

        // Criar a oficina com o usuario_id válido
        const oficinaSql = `
            INSERT INTO oficina (
                nome, endereco, cidade, estado, telefone, cep,
                horario_abertura, horario_fechamento, dias_funcionamento, 
                lat, lng, usuario_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        // Converter valores vazios para NULL e validar números
        let latValue = null;
        let lngValue = null;

        if (lat !== undefined && lat !== null && lat !== '') {
            latValue = parseFloat(lat);
            if (isNaN(latValue) || latValue < -90 || latValue > 90) {
                latValue = null; // Se inválido, define como null
            }
        }

        if (lng !== undefined && lng !== null && lng !== '') {
            lngValue = parseFloat(lng);
            if (isNaN(lngValue) || lngValue < -180 || lngValue > 180) {
                lngValue = null; // Se inválido, define como null
            }
        }

        const params = [
            nome, 
            endereco, 
            cidade, 
            estado, 
            telefone, 
            cep,
            horario_abertura ? horario_abertura + ':00' : '08:00:00',
            horario_fechamento ? horario_fechamento + ':00' : '18:00:00',
            dias_funcionamento || 'Seg-Sex',
            latValue,
            lngValue,
            usuarioId
        ];

        console.log('🔍 Executando SQL da oficina com parâmetros:', params);

        const oficinaResult = await new Promise((resolve, reject) => {
            db.query(oficinaSql, params, (err, result) => {
                if (err) {
                    console.error('❌ Erro SQL ao inserir oficina:', err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        console.log('✅ Oficina adicionada com sucesso, ID:', oficinaResult.insertId);
        
        res.json({ 
            success: true, 
            id: oficinaResult.insertId, 
            message: 'Oficina e usuário criados com sucesso!' 
        });

    } catch (error) {
        console.error('❌ Erro ao adicionar oficina:', error);
        
        // Tratamento específico para erro de range
        if (error.code === 'ER_WARN_DATA_OUT_OF_RANGE') {
            return res.status(400).json({ 
                success: false, 
                error: 'Valores de latitude ou longitude fora do range permitido. Latitude: -90 a 90, Longitude: -180 a 180.' 
            });
        }

        return res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor',
            details: error.message 
        });
    }
});

// ========== FIM DA ROTA DE OFICINA ==========
// ========== FIM DA ROTA DE OFICINA ==========
// ========== FIM DA ROTA DE OFICINA ==========
// ========== ROTA PARA BUSCAR OFICINA COM DADOS DO USUÁRIO ==========

// Rota para buscar oficina com dados do usuário
app.get('/api/oficina-completa/:id', (req, res) => {
    const { id } = req.params;
    
    console.log('🔍 Buscando oficina completa ID:', id);
    
    const sql = `
        SELECT 
            o.id, o.nome, o.endereco, o.cidade, o.estado, o.cep, o.telefone,
            o.horario_abertura, o.horario_fechamento, o.dias_funcionamento,
            o.lat, o.lng, o.usuario_id,
            u.email
        FROM oficina o
        LEFT JOIN usuario u ON o.usuario_id = u.id
        WHERE o.id = ?
    `;
    
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('❌ Erro ao buscar oficina completa:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
        
        if (results.length === 0) {
            console.log('❌ Oficina não encontrada ID:', id);
            return res.status(404).json({ 
                success: false, 
                message: 'Oficina não encontrada' 
            });
        }
        
        const oficina = results[0];
        console.log('✅ Oficina completa encontrada:', oficina);
        
        res.json({ 
            success: true, 
            oficina: oficina 
        });
    });
});

// ========== FIM DA ROTA DE OFICINA COMPLETA ==========
// ========== ROTA PARA ATUALIZAR OFICINA ==========

// Rota para atualizar oficina
app.put('/api/oficina/:id', async (req, res) => {
    const { id } = req.params;
    const {
        nome, email, senha, endereco, cidade, estado, telefone, horario_abertura,
        horario_fechamento, dias_funcionamento, lat, lng, cep
    } = req.body;

    console.log('🔄 Atualizando oficina ID:', id);
    console.log('📝 Dados recebidos:', req.body);

    // Validação dos campos obrigatórios
    if (!nome || !endereco || !cidade || !estado || !telefone || !cep) {
        return res.status(400).json({ 
            success: false, 
            error: 'Campos obrigatórios faltando: nome, endereco, cidade, estado, telefone, cep' 
        });
    }

    try {
        // Primeiro, buscar a oficina para obter o usuario_id
        const findOficinaSql = 'SELECT usuario_id FROM oficina WHERE id = ?';
        const oficinaResult = await new Promise((resolve, reject) => {
            db.query(findOficinaSql, [id], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        if (oficinaResult.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Oficina não encontrada' 
            });
        }

        const usuarioId = oficinaResult[0].usuario_id;
        console.log('🔍 Usuário ID encontrado:', usuarioId);

        // Atualizar o usuário (email e senha se fornecida)
        if (email) {
            let usuarioSql = 'UPDATE usuario SET email = ?';
            let usuarioParams = [email];

            // Se senha foi fornecida, atualizar também
            if (senha && senha.trim() !== '') {
                console.log('🔑 Atualizando senha do usuário');
                const bcrypt = require('bcryptjs');
                const saltRounds = 10;
                const senhaHash = await bcrypt.hash(senha, saltRounds);
                
                usuarioSql += ', senha = ?';
                usuarioParams.push(senhaHash);
            }

            usuarioSql += ' WHERE id = ?';
            usuarioParams.push(usuarioId);

            await new Promise((resolve, reject) => {
                db.query(usuarioSql, usuarioParams, (err, result) => {
                    if (err) reject(err);
                    else {
                        console.log('✅ Usuário atualizado');
                        resolve(result);
                    }
                });
            });
        }

        // Atualizar a oficina
        const oficinaSql = `
            UPDATE oficina SET
                nome = ?, endereco = ?, cidade = ?, estado = ?, telefone = ?, cep = ?,
                horario_abertura = ?, horario_fechamento = ?, dias_funcionamento = ?, 
                lat = ?, lng = ?, updated_at = NOW()
            WHERE id = ?
        `;
        
        const oficinaParams = [
            nome, endereco, cidade, estado, telefone, cep,
            horario_abertura || '08:00:00',
            horario_fechamento || '18:00:00',
            dias_funcionamento || 'Seg-Sex',
            lat || null,
            lng || null,
            id
        ];

        console.log('🔍 Executando UPDATE da oficina com parâmetros:', oficinaParams);

        const result = await new Promise((resolve, reject) => {
            db.query(oficinaSql, oficinaParams, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Oficina não encontrada' 
            });
        }

        console.log('✅ Oficina atualizada com sucesso!');
        
        res.json({ 
            success: true, 
            message: 'Oficina atualizada com sucesso!' 
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar oficina:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor',
            details: error.message 
        });
    }
});

// ========== FIM DA ROTA DE ATUALIZAÇÃO ==========
// ========== ROTA PARA EXCLUIR OFICINA ==========

// Rota para excluir oficina - VERSÃO COMPLETA
app.delete('/api/oficina/:id', async (req, res) => {
    const { id } = req.params;

    console.log('🗑️ Iniciando exclusão da oficina ID:', id);

    try {
        // Primeiro, buscar a oficina para obter o usuario_id
        const findOficinaSql = 'SELECT usuario_id FROM oficina WHERE id = ?';
        const oficinaResult = await new Promise((resolve, reject) => {
            db.query(findOficinaSql, [id], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        if (oficinaResult.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Oficina não encontrada' 
            });
        }

        const usuarioId = oficinaResult[0].usuario_id;
        console.log('🔍 Usuário ID encontrado:', usuarioId);

        // Iniciar transação para garantir consistência
        await new Promise((resolve, reject) => {
            db.query('START TRANSACTION', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        try {
            // 1. Excluir agendamentos relacionados à oficina
            const deleteAgendamentosSql = 'DELETE FROM agendamento_simples WHERE oficina_id = ?';
            await new Promise((resolve, reject) => {
                db.query(deleteAgendamentosSql, [id], (err, result) => {
                    if (err) reject(err);
                    else {
                        console.log('✅ Agendamentos excluídos:', result.affectedRows);
                        resolve(result);
                    }
                });
            });

            // 2. Excluir estoque relacionado à oficina
            const deleteEstoqueSql = 'DELETE FROM estoque WHERE oficina_id = ?';
            await new Promise((resolve, reject) => {
                db.query(deleteEstoqueSql, [id], (err, result) => {
                    if (err) reject(err);
                    else {
                        console.log('✅ Estoque excluído:', result.affectedRows);
                        resolve(result);
                    }
                });
            });

            // 3. Excluir configurações da oficina
            const deleteConfigSql = 'DELETE FROM oficina_config WHERE oficina_id = ?';
            await new Promise((resolve, reject) => {
                db.query(deleteConfigSql, [id], (err, result) => {
                    if (err) reject(err);
                    else {
                        console.log('✅ Configurações excluídas:', result.affectedRows);
                        resolve(result);
                    }
                });
            });

            // 4. Excluir horários especiais
            const deleteHorariosSql = 'DELETE FROM horarios_especiais WHERE oficina_id = ?';
            await new Promise((resolve, reject) => {
                db.query(deleteHorariosSql, [id], (err, result) => {
                    if (err) reject(err);
                    else {
                        console.log('✅ Horários especiais excluídos:', result.affectedRows);
                        resolve(result);
                    }
                });
            });

            // 5. Excluir capacidade da oficina
            const deleteCapacidadeSql = 'DELETE FROM oficina_capacidade WHERE oficina_id = ?';
            await new Promise((resolve, reject) => {
                db.query(deleteCapacidadeSql, [id], (err, result) => {
                    if (err) reject(err);
                    else {
                        console.log('✅ Capacidade excluída:', result.affectedRows);
                        resolve(result);
                    }
                });
            });

            // 6. Excluir a oficina
            const deleteOficinaSql = 'DELETE FROM oficina WHERE id = ?';
            const oficinaResult = await new Promise((resolve, reject) => {
                db.query(deleteOficinaSql, [id], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            if (oficinaResult.affectedRows === 0) {
                throw new Error('Oficina não encontrada para exclusão');
            }

            // 7. Excluir o usuário associado
            const deleteUsuarioSql = 'DELETE FROM usuario WHERE id = ?';
            await new Promise((resolve, reject) => {
                db.query(deleteUsuarioSql, [usuarioId], (err, result) => {
                    if (err) reject(err);
                    else {
                        console.log('✅ Usuário excluído:', result.affectedRows);
                        resolve(result);
                    }
                });
            });

            // Commit da transação
            await new Promise((resolve, reject) => {
                db.query('COMMIT', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            console.log('✅ Oficina e dados relacionados excluídos com sucesso!');
            
            res.json({ 
                success: true, 
                message: 'Oficina e todos os dados relacionados foram excluídos com sucesso!' 
            });

        } catch (error) {
            // Rollback em caso de erro
            await new Promise((resolve, reject) => {
                db.query('ROLLBACK', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            throw error;
        }

    } catch (error) {
        console.error('❌ Erro ao excluir oficina:', error);
        
        // Verificar se é um erro de chave estrangeira
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
            return res.status(409).json({ 
                success: false, 
                message: 'Não é possível excluir a oficina porque existem agendamentos ou outros registros vinculados a ela. Exclua primeiro os agendamentos relacionados.' 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor ao excluir oficina',
            details: error.message 
        });
    }
});
// ========== ROTAS DE PRODUTOS ==========

app.get('/api/produtos/oleo/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM produto_oleo WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar óleo:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json(results[0] || null);
    });
});

app.get('/api/produtos/filtro/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM produto_filtro WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar filtro:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json(results[0] || null);
    });
});

// ========== ROTAS DE CONFIGURAÇÕES DA OFICINA ==========

// Carregar configurações da oficina
app.get('/api/admin/configuracoes', requireAdminAuth, (req, res) => {
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
app.put('/api/admin/configuracoes', requireAdminAuth, (req, res) => {
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
app.get('/api/admin/horarios-funcionamento', requireAdminAuth, (req, res) => {
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
app.get('/api/admin/verificar-disponibilidade', requireAdminAuth, (req, res) => {
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
app.get('/api/admin/configuracoes/intervalo', requireAdminAuth, (req, res) => {
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
app.put('/api/admin/configuracoes/intervalo', requireAdminAuth, (req, res) => {
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




// Exportar a função para uso em outras partes do código
app.isValidDayForWorkshop = isValidDayForWorkshop;


// Rota para buscar informações completas da oficina (usada pelo frontend cliente)
app.get('/api/oficina/:id/detalhes', (req, res) => {
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
app.get('/api/oficina/:id/horarios-ocupados/:data', (req, res) => {
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
// ========== ROTAS GERAIS ==========

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/index.html'));
});

app.get('/login-adm.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/login-adm.html'));
});

app.get('/admindex.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/admindex.html'));
});

app.get('/api/test', (req, res) => {
    res.json({ message: 'Servidor funcionando!', timestamp: new Date() });
});

// Rota de teste para verificar a tabela agendamento_simples
app.get('/api/test/agendamento-table', (req, res) => {
    db.query('SELECT COUNT(*) as total FROM agendamento_simples', (err, results) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
        res.json({ 
            success: true, 
            total_registros: results[0].total,
            mensagem: 'Tabela agendamento_simples está acessível'
        });
    });
});

// Função auxiliar para validar dias de funcionamento
function isValidDayForWorkshop(selectedDate, workshop) {
    if (!selectedDate || !workshop || !workshop.dias_funcionamento) {
        return true; // Por segurança, assume que funciona
    }
    
    const dayOfWeek = selectedDate.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const diaSemana = dayNames[dayOfWeek];
    
    return workshop.dias_funcionamento.toLowerCase().includes(diaSemana);
}



// Importar e montar rotas admin
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// Manipulador de 404 para API (retorna JSON em vez de HTML)
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'Rota não encontrada' });
    }
    next();
});





// ==================== FUNÇÕES PARA HORÁRIOS ESPECIAIS - CLIENTE ====================

// Verificar se há horário especial para uma data - VERSÃO CORRIGIDA
async function verificarHorarioEspecial(oficinaId, data) {
    try {
        console.log('🔍 Verificando horário especial para:', data, 'Oficina:', oficinaId);

        const response = await fetch(`/api/oficina/${oficinaId}/horario-especial/${data}`);
        
        console.log('📡 Status da resposta:', response.status);
        
        if (!response.ok) {
            console.log('❌ Erro na resposta:', response.status, response.statusText);
            return null;
        }

        const dataResponse = await response.json();
        console.log('📦 Dados recebidos:', dataResponse);
        
        if (dataResponse.success && dataResponse.horario_especial) {
            console.log('🎯 Horário especial encontrado:', dataResponse.horario_especial);
            return dataResponse.horario_especial;
        }

        console.log('ℹ️ Nenhum horário especial encontrado');
        return null;
        
    } catch (error) {
        console.error('❌ Erro ao verificar horário especial:', error);
        return null;
    }
}

// Aplicar horário especial na interface
function aplicarHorarioEspecial(horarioEspecial) {
    const specialHoursAlert = document.getElementById('specialHoursAlert');
    const closedDayAlert = document.getElementById('closedDayAlert');

    // Resetar alerts
    if (specialHoursAlert) specialHoursAlert.style.display = 'none';
    if (closedDayAlert) closedDayAlert.style.display = 'none';

    if (!horarioEspecial) {
        console.log('ℹ️ Nenhum horário especial para aplicar');
        return;
    }

    console.log('🎨 Aplicando horário especial na interface:', horarioEspecial);

    // Se a oficina está fechada
    if (horarioEspecial.fechado) {
        console.log('🚫 Oficina fechada neste dia');
        if (closedDayAlert) {
            closedDayAlert.style.display = 'block';
            document.getElementById('closedDayMessage').textContent = 
                horarioEspecial.motivo ? 
                    `A oficina está fechada: ${horarioEspecial.motivo}` : 
                    'A oficina não funciona nesta data. Por favor, selecione outra data.';
        }
        return;
    }

    // Se tem horário especial
    if (horarioEspecial.horario_abertura && horarioEspecial.horario_fechamento) {
        console.log('🕒 Aplicando horário especial');
        if (specialHoursAlert) {
            specialHoursAlert.style.display = 'block';
            const message = horarioEspecial.motivo ?
                `Horário especial: ${horarioEspecial.horario_abertura.substring(0, 5)} - ${horarioEspecial.horario_fechamento.substring(0, 5)} (${horarioEspecial.motivo})` :
                `Horário especial: ${horarioEspecial.horario_abertura.substring(0, 5)} - ${horarioEspecial.horario_fechamento.substring(0, 5)}`;
                
            document.getElementById('specialHoursMessage').textContent = message;
        }
    }
}

// Verificar e aplicar horários especiais quando a data muda
async function verificarHorariosAoMudarData() {
    const dataInput = document.getElementById('schedule-date');
    const oficinaId = currentWorkshopId;

    console.log('📅 Verificando horários para mudança de data:', {
        data: dataInput?.value,
        oficinaId: oficinaId
    });

    if (!dataInput || !dataInput.value || !oficinaId) {
        console.log('⚠️ Dados insuficientes para verificar horários');
        return;
    }

    const horarioEspecial = await verificarHorarioEspecial(oficinaId, dataInput.value);
    aplicarHorarioEspecial(horarioEspecial);
}

// Função para limpar cache de horários especiais ao trocar de oficina
function clearSpecialHoursCache() {
    console.log('🧹 Limpando cache de horários especiais');
    specialHoursCache = {};
}

// ========== ROTAS PARA ADMIN GERAL ==========

// Rota para obter produtos (óleos e filtros)
app.get('/api/produtos/oleo', (req, res) => {
    const sql = 'SELECT * FROM produto_oleo ORDER BY nome';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar óleos:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json(results);
    });
});

app.get('/api/produtos/filtro', (req, res) => {
    const sql = 'SELECT * FROM produto_filtro ORDER BY nome';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar filtros:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json(results);
    });
});

// Rota para adicionar óleo
app.post('/api/produtos/oleo', (req, res) => {
    const { nome, tipo, viscosidade, especificacao, marca, preco } = req.body;
    
    const sql = `
        INSERT INTO produto_oleo (nome, tipo, viscosidade, especificacao, marca, preco)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    db.query(sql, [nome, tipo, viscosidade, especificacao, marca, preco], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar óleo:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json({ success: true, id: result.insertId, message: 'Óleo adicionado com sucesso' });
    });
});

// Rota para adicionar filtro
app.post('/api/produtos/filtro', (req, res) => {
    const { nome, tipo, compatibilidade_modelo, preco } = req.body;
    
    const sql = `
        INSERT INTO produto_filtro (nome, tipo, compatibilidade_modelo, preco)
        VALUES (?, ?, ?, ?)
    `;
    
    db.query(sql, [nome, tipo, compatibilidade_modelo, preco], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar filtro:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json({ success: true, id: result.insertId, message: 'Filtro adicionado com sucesso' });
    });
});

// Rota para adicionar oficina
app.post('/api/oficina', (req, res) => {
    const {
        nome, endereco, cidade, estado, telefone, horario_abertura,
        horario_fechamento, dias_funcionamento, lat, lng, usuario_id
    } = req.body;
    
    const sql = `
        INSERT INTO oficina (
            nome, endereco, cidade, estado, telefone, horario_abertura,
            horario_fechamento, dias_funcionamento, lat, lng, usuario_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(sql, [
        nome, endereco, cidade, estado, telefone, horario_abertura,
        horario_fechamento, dias_funcionamento, lat, lng, usuario_id
    ], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar oficina:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json({ success: true, id: result.insertId, message: 'Oficina adicionada com sucesso' });
    });
});

// Rota para adicionar marca
app.post('/api/marca', (req, res) => {
    const { nome } = req.body;
    
    const sql = 'INSERT INTO marca (nome) VALUES (?)';
    
    db.query(sql, [nome], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar marca:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json({ success: true, id: result.insertId, message: 'Marca adicionada com sucesso' });
    });
});

// Rota para adicionar modelo
app.post('/api/modelo', (req, res) => {
    const { nome, marca_id, tipo } = req.body;
    
    const sql = 'INSERT INTO modelo (nome, marca_id, tipo) VALUES (?, ?, ?)';
    
    db.query(sql, [nome, marca_id, tipo], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar modelo:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json({ success: true, id: result.insertId, message: 'Modelo adicionado com sucesso' });
    });
});

// Rota para adicionar ano de modelo
app.post('/api/ano-modelo', (req, res) => {
    const { modelo_id, ano } = req.body;
    
    const sql = 'INSERT INTO modelo_ano (modelo_id, ano) VALUES (?, ?)';
    
    db.query(sql, [modelo_id, ano], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar ano de modelo:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json({ success: true, id: result.insertId, message: 'Ano de modelo adicionado com sucesso' });
    });
});

// Rota para obter modelos completos (com nome da marca)
app.get('/api/modelos-completos', (req, res) => {
    const sql = `
        SELECT 
            m.id as id_modelo,
            m.nome as nome_modelo,
            m.tipo,
            ma.id as id_marca,
            ma.nome as nome_marca
        FROM modelo m
        JOIN marca ma ON m.marca_id = ma.id
        ORDER BY ma.nome, m.nome
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar modelos completos:', err);
            return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
        res.json({ success: true, data: results });
    });
});

// Rota para obter anos completos (com nome do modelo e marca)
app.get('/api/anos-completos', (req, res) => {
    const sql = `
        SELECT 
            ma.id as id_ano,
            ma.ano,
            m.id as id_modelo,
            m.nome as nome_modelo,
            m.tipo,
            mar.id as id_marca,
            mar.nome as nome_marca
        FROM modelo_ano ma
        JOIN modelo m ON ma.modelo_id = m.id
        JOIN marca mar ON m.marca_id = mar.id
        ORDER BY mar.nome, m.nome, ma.ano
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar anos completos:', err);
            return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
        res.json({ success: true, data: results });
    });
});

// Rota para deletar produtos
app.delete('/api/produtos/oleo/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = 'DELETE FROM produto_oleo WHERE id = ?';
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Erro ao deletar óleo:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Óleo não encontrado' });
        }
        
        res.json({ success: true, message: 'Óleo deletado com sucesso' });
    });
});

app.delete('/api/produtos/filtro/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = 'DELETE FROM produto_filtro WHERE id = ?';
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Erro ao deletar filtro:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Filtro não encontrado' });
        }
        
        res.json({ success: true, message: 'Filtro deletado com sucesso' });
    });
});

// Rota para deletar oficina
app.delete('/api/oficina/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = 'DELETE FROM oficina WHERE id = ?';
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Erro ao deletar oficina:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Oficina não encontrada' });
        }
        
        res.json({ success: true, message: 'Oficina deletada com sucesso' });
    });
});

// Rota para deletar marca
app.delete('/api/marca/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = 'DELETE FROM marca WHERE id = ?';
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Erro ao deletar marca:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Marca não encontrada' });
        }
        
        res.json({ success: true, message: 'Marca deletada com sucesso' });
    });
});

// Rota para deletar modelo
app.delete('/api/modelo/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = 'DELETE FROM modelo WHERE id = ?';
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Erro ao deletar modelo:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Modelo não encontrado' });
        }
        
        res.json({ success: true, message: 'Modelo deletado com sucesso' });
    });
});

// Rota para deletar ano de modelo
app.delete('/api/ano-modelo/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = 'DELETE FROM modelo_ano WHERE id = ?';
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Erro ao deletar ano de modelo:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ano de modelo não encontrado' });
        }
        
        res.json({ success: true, message: 'Ano de modelo deletado com sucesso' });
    });
});


// ========== INICIAR SERVIDOR ==========

app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
    console.log(`📊 Painel administrativo: http://localhost:${PORT}/admindex.html`);
    console.log(`👤 Painel do cliente: http://localhost:${PORT}/html/index.html`);
});
module.exports = app;