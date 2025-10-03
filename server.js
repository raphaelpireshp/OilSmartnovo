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

// Middleware de log para debug
app.use('/api/admin/*', (req, res, next) => {
    console.log(`📝 Rota ADMIN acessada: ${req.method} ${req.originalUrl}`);
    next();
});

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


// No server.js - CORRIGIR a rota de divergência
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
app.use('/api/lembretes_troca_oleo', lembreteTrocaOleoRoutes);

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

// ========== INICIAR SERVIDOR ==========

app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
    console.log(`📊 Painel administrativo: http://localhost:${PORT}/admindex.html`);
    console.log(`👤 Painel do cliente: http://localhost:${PORT}/html/agenda.html`);
});

module.exports = app;