const express = require('express');
const db = require('../../database/db');
const requireAdminAuth = require('../../middlewares/requireAdminAuth');

const router = express.Router();

router.get('/api/admin/estoque', requireAdminAuth, (req, res) => {
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
router.put('/api/admin/estoque/:id', requireAdminAuth, (req, res) => {
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

// ========== ROTAS PARA RELATÓRIOS E ANALYTICS ==========

// Rota principal de relatórios - VERSÃO COMPLETA
router.get('/api/admin/relatorios/agendamentos', requireAdminAuth, (req, res) => {
    const oficinaId = req.session.admin.oficina_id;
    const { data_inicio, data_fim } = req.query;
    
    console.log('📊 Gerando relatório para oficina:', oficinaId);
    console.log('📅 Período:', { data_inicio, data_fim });

    // Query para relatório por status
    let queryRelatorio = `
        SELECT 
            status,
            COUNT(*) as quantidade,
            SUM(total_servico) as valor_total
        FROM agendamento_simples 
        WHERE oficina_id = ?
    `;
    
    const params = [oficinaId];
    
    if (data_inicio && data_fim) {
        queryRelatorio += ' AND DATE(data_hora) BETWEEN ? AND ?';
        params.push(data_inicio, data_fim);
    }
    
    queryRelatorio += ' GROUP BY status ORDER BY status';

    // Query para resumo geral
    let queryResumo = `
        SELECT 
            COUNT(*) as total_agendamentos,
            SUM(CASE WHEN status = 'concluido' THEN total_servico ELSE 0 END) as valor_total,
            ROUND((SUM(CASE WHEN status = 'concluido' THEN 1 ELSE 0 END) / COUNT(*) * 100), 2) as taxa_conclusao,
            ROUND(AVG(CASE WHEN status = 'concluido' THEN total_servico ELSE NULL END), 2) as ticket_medio
        FROM agendamento_simples 
        WHERE oficina_id = ?
    `;
    
    const paramsResumo = [oficinaId];
    
    if (data_inicio && data_fim) {
        queryResumo += ' AND DATE(data_hora) BETWEEN ? AND ?';
        paramsResumo.push(data_inicio, data_fim);
    }

    // Executar ambas as queries
    db.query(queryRelatorio, params, (err, relatorioResults) => {
        if (err) {
            console.error('❌ Erro ao gerar relatório:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        db.query(queryResumo, paramsResumo, (err, resumoResults) => {
            if (err) {
                console.error('❌ Erro ao gerar resumo:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro interno do servidor' 
                });
            }

            const resumo = resumoResults[0] || {
                total_agendamentos: 0,
                valor_total: 0,
                taxa_conclusao: 0,
                ticket_medio: 0
            };

            console.log('✅ Relatório gerado com sucesso');
            console.log('📈 Resumo:', resumo);
            console.log('📋 Detalhes por status:', relatorioResults);

            res.json({
                success: true,
                relatorio: relatorioResults,
                resumo: resumo
            });
        });
    });
});

// Rota para detalhes por status
router.get('/api/admin/relatorios/agendamentos/:status', requireAdminAuth, (req, res) => {
    const oficinaId = req.session.admin.oficina_id;
    const { status } = req.params;
    const { data_inicio, data_fim } = req.query;

    let query = `
        SELECT 
            id,
            cliente_nome,
            veiculo,
            data_hora,
            total_servico,
            protocolo
        FROM agendamento_simples 
        WHERE oficina_id = ? AND status = ?
    `;
    
    const params = [oficinaId, status];
    
    if (data_inicio && data_fim) {
        query += ' AND DATE(data_hora) BETWEEN ? AND ?';
        params.push(data_inicio, data_fim);
    }
    
    query += ' ORDER BY data_hora DESC';

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('❌ Erro ao buscar detalhes:', err);
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

// Rota para exportar relatório
router.get('/api/admin/relatorios/exportar', requireAdminAuth, (req, res) => {
    const oficinaId = req.session.admin.oficina_id;
    const { tipo, data_inicio, data_fim } = req.query;

    let query = `
        SELECT 
            protocolo,
            cliente_nome,
            cliente_telefone,
            veiculo,
            servicos,
            data_hora,
            status,
            total_servico
        FROM agendamento_simples 
        WHERE oficina_id = ?
    `;
    
    const params = [oficinaId];
    
    if (data_inicio && data_fim) {
        query += ' AND DATE(data_hora) BETWEEN ? AND ?';
        params.push(data_inicio, data_fim);
    }
    
    if (tipo && tipo !== 'geral') {
        query += ' AND status = ?';
        params.push(tipo);
    }
    
    query += ' ORDER BY data_hora DESC';

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('❌ Erro ao exportar relatório:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }

        // Converter para CSV
        const csvData = convertToCSV(results);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio_${tipo || 'geral'}_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csvData);
    });
});

// Função auxiliar para converter para CSV
function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(';');
    
    const csvRows = data.map(row => {
        return headers.map(header => {
            let value = row[header] || '';
            // Escapar caracteres especiais para CSV
            if (typeof value === 'string' && (value.includes(';') || value.includes('"') || value.includes('\n'))) {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(';');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
}

// Rota para analytics avançados
router.get('/api/admin/relatorios/analytics', requireAdminAuth, (req, res) => {
    const oficinaId = req.session.admin.oficina_id;
    const { periodo = '30' } = req.query; // dias

    const queries = {
        // Agendamentos por dia (últimos 30 dias)
        agendamentosPorDia: `
            SELECT 
                DATE(data_hora) as data,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'concluido' THEN 1 ELSE 0 END) as concluidos,
                SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) as cancelados
            FROM agendamento_simples 
            WHERE oficina_id = ? 
            AND data_hora >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(data_hora)
            ORDER BY data DESC
        `,

        // Serviços mais populares
        servicosPopulares: `
            SELECT 
                servicos,
                COUNT(*) as total_vezes,
                SUM(total_servico) as valor_total
            FROM agendamento_simples 
            WHERE oficina_id = ? 
            AND status = 'concluido'
            AND data_hora >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY servicos
            ORDER BY total_vezes DESC
            LIMIT 10
        `,

        // Horários mais populares
        horariosPopulares: `
            SELECT 
                HOUR(data_hora) as hora,
                COUNT(*) as total_agendamentos
            FROM agendamento_simples 
            WHERE oficina_id = ? 
            AND data_hora >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY HOUR(data_hora)
            ORDER BY total_agendamentos DESC
        `
    };

    const analytics = {};
    let completedQueries = 0;
    const totalQueries = Object.keys(queries).length;

    Object.entries(queries).forEach(([key, query]) => {
        db.query(query, [oficinaId, parseInt(periodo)], (err, results) => {
            if (err) {
                console.error(`Erro na query ${key}:`, err);
                analytics[key] = [];
            } else {
                analytics[key] = results;
            }
            
            completedQueries++;
            if (completedQueries === totalQueries) {
                res.json({
                    success: true,
                    analytics: analytics,
                    periodo: periodo
                });
            }
        });
    });
});


module.exports = router;
