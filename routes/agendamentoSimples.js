const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Função para gerar código de confirmação único
function gerarCodigoConfirmacao() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `OIL${timestamp}${random}`;
}

// Função para limpar serviços
function limparServicos(servicos) {
    if (!servicos) return 'Serviços não especificados';
    
    // Remover caracteres indesejados
    return servicos.toString()
        .replace(/[\[\]"]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// Rota POST para criar agendamento
router.post("/", (req, res) => {
    console.log('=== DADOS RECEBIDOS NO BACKEND ===');
    console.log('Body completo:', JSON.stringify(req.body, null, 2));
    console.log('==================================');

    const {
        protocolo,
        data_hora,
        oficina_nome,
        oficina_endereco,
        oficina_telefone,
        veiculo,
        servicos,
        total_servico,
        cliente_nome,
        cliente_cpf,
        cliente_telefone,
        cliente_email,
        usuario_id
    } = req.body;

    // VALIDAÇÃO MAIS FLEXÍVEL - apenas campos realmente essenciais
    if (!cliente_nome || !cliente_telefone || !data_hora) {
        console.log('Campos obrigatórios faltando:', {
            cliente_nome: !!cliente_nome,
            cliente_telefone: !!cliente_telefone,
            data_hora: !!data_hora
        });
        
        return res.status(400).json({ 
            success: false, 
            message: 'Campos obrigatórios: nome, telefone e data/hora',
            campos_recebidos: req.body
        });
    }

    // Usar protocolo gerado ou gerar um novo
    const protocoloFinal = protocolo || gerarCodigoConfirmacao();
    const servicosLimpos = limparServicos(servicos);

    // PREPARAR VALORES COM VALIDAÇÕES INDIVIDUAIS
    const values = [
        protocoloFinal,
        data_hora || null,
        oficina_nome || 'Oficina não especificada',
        oficina_endereco || 'Endereço não informado',
        oficina_telefone || 'Telefone não informado',
        veiculo ? (typeof veiculo === 'string' ? veiculo : JSON.stringify(veiculo)) : 'Veículo não informado',
        servicosLimpos,
        parseFloat(total_servico) || 0.00,
        cliente_nome,
        cliente_cpf ? cliente_cpf.replace(/\D/g, '') : 'CPF não informado',
        cliente_telefone,
        cliente_email || 'email@naoinformado.com',
        usuario_id || null,
        status 
    ];

    console.log('Valores para inserção:', values);

    const query = `
        INSERT INTO agendamento_simples (
            protocolo, data_hora, oficina_nome, oficina_endereco, oficina_telefone,
            veiculo, servicos, total_servico, cliente_nome, cliente_cpf, 
            cliente_telefone, cliente_email, usuario_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('❌ Erro MySQL ao salvar agendamento:', err);
            console.error('SQL:', err.sql);
            
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao salvar agendamento no banco de dados',
                error: err.sqlMessage || err.message,
                sql: err.sql,
                values: values
            });
        }

        console.log('✅ Agendamento salvo com sucesso. ID:', result.insertId);
        
        res.status(201).json({ 
            success: true, 
            agendamento_id: result.insertId,
            codigo_confirmacao: protocoloFinal,
            message: 'Agendamento salvo com sucesso!'
        });
    });
});

// Adicione uma rota para atualizar status em lote (para ser executada periodicamente)
router.post('/atualizar-status', (req, res) => {
    const query = `
        UPDATE agendamento_simples 
        SET status = 'fora_prazo' 
        WHERE data_hora < NOW() 
        AND status IN ('pendente', 'confirmado')
    `;
    
    db.query(query, (err, result) => {
        if (err) {
            console.error('Erro ao atualizar status:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao atualizar status' 
            });
        }
        
        res.json({ 
            success: true, 
            message: `Status atualizados: ${result.affectedRows} agendamentos`,
            atualizados: result.affectedRows
        });
    });
});

// Adicione uma rota para cancelar agendamento
router.post('/:id/cancelar', (req, res) => {
    const { id } = req.params;
    const { motivo } = req.body;
    
    const query = `
        UPDATE agendamento_simples 
        SET status = 'cancelado', motivo_cancelamento = ?
        WHERE id = ?
    `;
    
    db.query(query, [motivo || 'Cancelado pelo usuário', id], (err, result) => {
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
            message: 'Agendamento cancelado com sucesso!' 
        });
    });
});

// Rota para buscar agendamentos por oficina
router.get('/oficina/:oficina_nome', (req, res) => {
    const { oficina_nome } = req.params;

    const query = `
        SELECT * FROM agendamento_simples 
        WHERE oficina_nome LIKE ?
        ORDER BY data_hora DESC
    `;

    db.query(query, [`%${oficina_nome}%`], (err, results) => {
        if (err) {
            console.error('Erro ao buscar agendamentos:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar agendamentos' 
            });
        }

        res.json({ 
            success: true, 
            data: results 
        });
    });
});

// Rota para buscar agendamentos por cliente
router.get("/cliente/:cliente_email", (req, res) => {
    const { cliente_email } = req.params;

    const query = `
        SELECT * FROM agendamento_simples 
        WHERE cliente_email = ?
        ORDER BY data_hora DESC
    `;

    db.query(query, [cliente_email], (err, results) => {
        if (err) {
            console.error('Erro ao buscar agendamentos do cliente:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar agendamentos do cliente' 
            });
        }

        res.json({ 
            success: true, 
            data: results 
        });
    });
});

// Rota para buscar agendamento por ID
router.get('/:id', (req, res) => {
    const { id } = req.params;

    const query = 'SELECT * FROM agendamento_simples WHERE id = ?';
    
    db.query(query, [id], (err, results) => {
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
            data: results[0] 
        });
    });
});

// Rota para buscar todos os agendamentos
router.get('/', (req, res) => {
    const query = 'SELECT * FROM agendamento_simples ORDER BY data_hora DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar agendamentos:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar agendamentos' 
            });
        }

        res.json({ 
            success: true, 
            data: results 
        });
    });
});

// Rota para atualizar agendamento
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const {
        data_hora,
        oficina_nome,
        oficina_endereco,
        oficina_telefone,
        veiculo,
        servicos,
        total_servico,
        cliente_nome,
        cliente_cpf,
        cliente_telefone,
        cliente_email
    } = req.body;

    const servicosLimpos = limparServicos(servicos);

    const query = `
        UPDATE agendamento_simples 
        SET data_hora = ?, oficina_nome = ?, oficina_endereco = ?, oficina_telefone = ?,
            veiculo = ?, servicos = ?, total_servico = ?, cliente_nome = ?, cliente_cpf = ?,
            cliente_telefone = ?, cliente_email = ?
        WHERE id = ?
    `;

    const values = [
        data_hora,
        oficina_nome,
        oficina_endereco,
        oficina_telefone,
        veiculo ? (typeof veiculo === 'string' ? veiculo : JSON.stringify(veiculo)) : 'Veículo não informado',
        servicosLimpos,
        parseFloat(total_servico) || 0.00,
        cliente_nome,
        cliente_cpf ? cliente_cpf.replace(/\D/g, '') : 'CPF não informado',
        cliente_telefone,
        cliente_email,
        id
    ];

    db.query(query, values, (err, result) => {
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
            message: 'Agendamento atualizado com sucesso!' 
        });
    });
});

// Rota para deletar agendamento
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM agendamento_simples WHERE id = ?';
    
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Erro ao deletar agendamento:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao deletar agendamento' 
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
            message: 'Agendamento deletado com sucesso!' 
        });
    });
});
// Rota para buscar agendamentos por usuário ID
router.get('/usuario/:usuario_id', (req, res) => {
    const { usuario_id } = req.params;

    const query = `
        SELECT * FROM agendamento_simples 
        WHERE usuario_id = ?
        ORDER BY data_hora DESC
    `;

    db.query(query, [usuario_id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar agendamentos do usuário:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar agendamentos' 
            });
        }

        res.json({ 
            success: true, 
            data: results 
        });
    });
});

function verificarStatusAutomatico(data_hora) {
    const agora = new Date();
    const dataAgendamento = new Date(data_hora);
    
    // Se a data do agendamento já passou e ainda está como pendente/confirmado
    if (dataAgendamento < agora) {
        return 'fora_prazo';
    }
    
    return 'pendente';
}

// Rota para cancelar agendamento
router.post('/:id/cancelar', (req, res) => {
    const { id } = req.params;
    const { motivo } = req.body;
    
    console.log(`📋 Cancelando agendamento ${id}, motivo:`, motivo);
    
    const query = `
        UPDATE agendamento_simples 
        SET status = 'cancelado', motivo_cancelamento = ?
        WHERE id = ? AND status IN ('pendente', 'confirmado')
    `;
    
    db.query(query, [motivo || 'Cancelado pelo usuário', id], (err, result) => {
        if (err) {
            console.error('❌ Erro ao cancelar agendamento:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao cancelar agendamento' 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Agendamento não encontrado ou não pode ser cancelado' 
            });
        }
        
        console.log('✅ Agendamento cancelado com sucesso');
        res.json({ 
            success: true, 
            message: 'Agendamento cancelado com sucesso!' 
        });
    });
});

// Rota para buscar agendamento por ID (se já não tiver)
router.get('/:id', (req, res) => {
    const { id } = req.params;

    const query = 'SELECT * FROM agendamento_simples WHERE id = ?';
    
    db.query(query, [id], (err, results) => {
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
            data: results[0] 
        });
    });
});
module.exports = router;