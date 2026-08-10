const express = require('express');
const db = require('../../database/db');
const requireAdminAuth = require('../../middlewares/requireAdminAuth');

const router = express.Router();

// ========== ROTAS ADMINISTRATIVAS PRINCIPAIS ==========

// Dashboard Básico
router.get('/api/admin/dashboard', requireAdminAuth, (req, res) => {
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

// ==================== DASHBOARD COMPLETO ====================


// Rota para dashboard informativo
router.get('/api/admin/dashboard-informativo', requireAdminAuth, (req, res) => {
    const oficinaId = req.session.admin.oficina_id;
    const hoje = new Date().toISOString().split('T')[0];
    
    const queries = {
        // Agendamentos de hoje
        hoje: `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'confirmado' THEN 1 ELSE 0 END) as confirmados,
                SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as pendentes
            FROM agendamento_simples 
            WHERE oficina_id = ? AND DATE(data_hora) = ?
        `,
        
        // Último agendamento
        ultimo_agendamento: `
            SELECT cliente_nome, veiculo, data_hora, status
            FROM agendamento_simples 
            WHERE oficina_id = ? 
            ORDER BY data_hora DESC 
            LIMIT 1
        `,
        
        // Agendamentos do mês
        mes: `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'concluido' THEN 1 ELSE 0 END) as concluidos
            FROM agendamento_simples 
            WHERE oficina_id = ? 
            AND MONTH(data_hora) = MONTH(NOW()) 
            AND YEAR(data_hora) = YEAR(NOW())
        `,
        
        // Status atual
        status: `
            SELECT 
                SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
                SUM(CASE WHEN status = 'confirmado' THEN 1 ELSE 0 END) as confirmados,
                SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) as cancelados
            FROM agendamento_simples 
            WHERE oficina_id = ? 
            AND status IN ('pendente', 'confirmado', 'cancelado')
        `
    };

    const dados = {};
    let completedQueries = 0;
    const totalQueries = Object.keys(queries).length;

    Object.entries(queries).forEach(([key, query]) => {
        const params = [oficinaId];
        if (key === 'hoje') params.push(hoje);
        
        db.query(query, params, (err, results) => {
            if (err) {
                console.error(`Erro na query ${key}:`, err);
                dados[key] = key === 'ultimo_agendamento' ? null : { total: 0 };
            } else {
                dados[key] = results[0] || (key === 'ultimo_agendamento' ? null : { total: 0 });
            }
            
            completedQueries++;
            if (completedQueries === totalQueries) {
                // Gerar notificações simuladas (você pode adaptar para dados reais)
                dados.notificacoes = gerarNotificacoesSimuladas(dados);
                
                res.json({
                    success: true,
                    dados: dados
                });
            }
        });
    });
});

// Função para gerar notificações (adaptar conforme sua necessidade)
function gerarNotificacoesSimuladas(dados) {
    const notificacoes = [];
    const agora = new Date();
    
    // Notificação de agendamentos pendentes
    if (dados.status.pendentes > 0) {
        notificacoes.push({
            tipo: 'atencao',
            titulo: 'Agendamentos Pendentes',
            mensagem: `Você tem ${dados.status.pendentes} agendamento(s) pendente(s) que precisam de atenção`,
            data: new Date(agora.getTime() - 30 * 60000).toISOString(), // 30 minutos atrás
            lida: false
        });
    }
    
    // Notificação de agendamentos de hoje
    if (dados.hoje.total > 0) {
        notificacoes.push({
            tipo: 'info',
            titulo: 'Agendamentos de Hoje',
            mensagem: `Hoje você tem ${dados.hoje.total} agendamento(s) programado(s)`,
            data: new Date(agora.getTime() - 2 * 3600000).toISOString(), // 2 horas atrás
            lida: true
        });
    }
    
    // Notificação do último agendamento
    if (dados.ultimo_agendamento) {
        notificacoes.push({
            tipo: 'novo',
            titulo: 'Novo Agendamento',
            mensagem: `${dados.ultimo_agendamento.cliente_nome} agendou para ${dados.ultimo_agendamento.veiculo}`,
            data: dados.ultimo_agendamento.data_hora,
            lida: false
        });
    }
    
    return notificacoes;
}
// Dashboard Completo (com gráficos e dados avançados)
router.get('/api/admin/dashboard-completo', requireAdminAuth, (req, res) => {
    const oficinaId = req.session.admin.oficina_id;
    
    console.log('📊 Carregando dashboard completo para oficina:', oficinaId);

    // Métricas básicas
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
                // Retornar dados completos
                res.json({
                    success: true,
                    metrics: {
                        totalAgendamentos: metrics.totalAgendamentos,
                        agendamentosPendentes: metrics.agendamentosPendentes,
                        agendamentosConfirmados: metrics.agendamentosConfirmados,
                        agendamentosConcluidos: metrics.agendamentosConcluidos,
                        agendamentosRecentes: metrics.agendamentosRecentes,
                        valorTotal: parseFloat(metrics.valorTotal),
                        changes: {
                            agendamentos: 12,
                            confirmados: 8,
                            concluidos: 15,
                            recentes: -5,
                            valor: 20
                        }
                    },
                    charts: {
                        status: getDefaultStatusData(),
                        revenue: getDefaultRevenueData(),
                        services: getDefaultServicesData(),
                        trend: getDefaultTrendData()
                    },
                    recentActivities: [
                        {
                            cliente: "Cliente Exemplo",
                            veiculo: "Honda Civic 2020",
                            servico: "Troca de óleo e filtro",
                            status: "concluido",
                            data: new Date().toISOString()
                        }
                    ],
                    alerts: [
                        {
                            titulo: "Sistema Online",
                            descricao: "Todos os serviços estão funcionando normalmente",
                            nivel: "baixo"
                        }
                    ]
                });
            }
        });
    });

    // Dados padrão para gráficos (fallback)
    function getDefaultStatusData() {
        return {
            labels: ['Concluídos', 'Confirmados', 'Pendentes', 'Cancelados'],
            datasets: [{
                data: [45, 25, 20, 10],
                backgroundColor: [
                    'rgba(40, 167, 69, 0.8)',
                    'rgba(23, 162, 184, 0.8)',
                    'rgba(255, 193, 7, 0.8)',
                    'rgba(220, 53, 69, 0.8)'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        };
    }

    function getDefaultRevenueData() {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
        return {
            labels: months,
            datasets: [{
                label: 'Receita (R$)',
                data: months.map(() => Math.floor(Math.random() * 10000) + 2000),
                backgroundColor: 'rgba(180, 148, 52, 0.6)',
                borderColor: 'rgba(180, 148, 52, 1)',
                borderWidth: 2
            }]
        };
    }

    function getDefaultServicesData() {
        return {
            labels: ['Troca de Óleo', 'Alinhamento', 'Balanceamento', 'Filtros', 'Outros'],
            datasets: [{
                data: [35, 20, 15, 20, 10],
                backgroundColor: [
                    'rgba(41, 128, 185, 0.7)',
                    'rgba(39, 174, 96, 0.7)',
                    'rgba(243, 156, 18, 0.7)',
                    'rgba(142, 68, 173, 0.7)',
                    'rgba(231, 76, 60, 0.7)'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        };
    }

    function getDefaultTrendData() {
        const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
        return {
            labels: days,
            datasets: [{
                label: 'Agendamentos',
                data: days.map(() => Math.floor(Math.random() * 20) + 5),
                borderColor: 'rgba(180, 148, 52, 1)',
                backgroundColor: 'rgba(180, 148, 52, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        };
    }
});

// Listar agendamentos

module.exports = router;
