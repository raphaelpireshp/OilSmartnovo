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

// ROTA ORIGINAL PARA CLIENTES - MODIFICADA
router.post("/", (req, res) => {
    console.log('=== DADOS RECEBIDOS NO BACKEND (CLIENTE) ===');
    console.log('Body completo:', JSON.stringify(req.body, null, 2));

    const {
        protocolo,
        data_hora,
        oficina_nome,
        oficina_endereco,
        oficina_telefone,
        oficina_id, // ← ADICIONAR ESTE CAMPO
        veiculo,
        servicos,
        total_servico,
        cliente_nome,
        cliente_cpf,
        cliente_telefone,
        cliente_email,
        usuario_id
    } = req.body;

    // VALIDAÇÃO ATUALIZADA
    if (!cliente_nome || !cliente_telefone || !data_hora || !usuario_id || !oficina_id) {
        console.log('Campos obrigatórios faltando para cliente:', {
            cliente_nome: !!cliente_nome,
            cliente_telefone: !!cliente_telefone,
            data_hora: !!data_hora,
            usuario_id: !!usuario_id,
            oficina_id: !!oficina_id
        });
        
        return res.status(400).json({ 
            success: false, 
            message: 'Campos obrigatórios: nome, telefone, data/hora, usuario_id E oficina_id',
            campos_recebidos: req.body
        });
    }

    const protocoloFinal = protocolo || gerarCodigoConfirmacao();
    const servicosLimpos = limparServicos(servicos);

    // VALORES ATUALIZADOS (com oficina_id)
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
        usuario_id,
        oficina_id // ← AGORA SALVA O oficina_id TAMBÉM
    ];

    console.log('Valores para inserção (CLIENTE):', values);

    const query = `
        INSERT INTO agendamento_simples (
            protocolo, data_hora, oficina_nome, oficina_endereco, oficina_telefone,
            veiculo, servicos, total_servico, cliente_nome, 
            cliente_cpf, cliente_telefone, cliente_email, usuario_id, oficina_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('❌ Erro MySQL ao salvar agendamento CLIENTE:', err);
            console.error('SQL:', err.sql);
            
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao salvar agendamento no banco de dados',
                error: err.sqlMessage || err.message,
                sql: err.sql,
                values: values
            });
        }

        console.log('✅ Agendamento CLIENTE salvo com sucesso. ID:', result.insertId);
        
        res.status(201).json({ 
            success: true, 
            agendamento_id: result.insertId,
            codigo_confirmacao: protocoloFinal,
            message: 'Agendamento salvo com sucesso!'
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
// Adicione esta rota no final do arquivo agendamentoSimples.js

// Rota para cancelar agendamento
router.post('/:id/cancelar', (req, res) => {
    const { id } = req.params;
    const { motivo } = req.body;

    console.log('🎯 Recebendo solicitação de cancelamento para agendamento:', id);
    console.log('📝 Motivo:', motivo);

    if (!motivo || motivo.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Motivo do cancelamento é obrigatório'
        });
    }

    // Primeiro verificar se o agendamento existe e pode ser cancelado
    const checkQuery = `
        SELECT id, data_hora, status 
        FROM agendamento_simples 
        WHERE id = ?
    `;

    db.query(checkQuery, [id], (err, results) => {
        if (err) {
            console.error('❌ Erro ao verificar agendamento:', err);
            return res.status(500).json({
                success: false,
                message: 'Erro ao verificar agendamento'
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Agendamento não encontrado'
            });
        }

        const agendamento = results[0];
        const dataAgendamento = new Date(agendamento.data_hora);
        const agora = new Date();

        // Verificar se já passou da data
        if (dataAgendamento <= agora) {
            return res.status(400).json({
                success: false,
                message: 'Não é possível cancelar agendamentos passados'
            });
        }

        // Verificar se já está cancelado
        if (agendamento.status === 'cancelado') {
            return res.status(400).json({
                success: false,
                message: 'Este agendamento já está cancelado'
            });
        }

        // Atualizar o agendamento
        const updateQuery = `
            UPDATE agendamento_simples 
            SET status = 'cancelado',
                motivo_cancelamento = ?,
                data_cancelamento = NOW()
            WHERE id = ?
        `;

        db.query(updateQuery, [motivo.trim(), id], (err, result) => {
            if (err) {
                console.error('❌ Erro ao cancelar agendamento:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao cancelar agendamento no banco de dados',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Agendamento não encontrado para cancelamento'
                });
            }

            console.log('✅ Agendamento cancelado com sucesso. ID:', id);
            
            res.json({
                success: true,
                message: 'Agendamento cancelado com sucesso!'
            });
        });
    });
});

// Rota para atualizar status automaticamente (fora do prazo)
router.post('/atualizar-status/automatico', (req, res) => {
    const query = `
        UPDATE agendamento_simples 
        SET status = 'fora_prazo' 
        WHERE data_hora < NOW() 
        AND status IN ('pendente', 'confirmado')
    `;
    
    db.query(query, (err, result) => {
        if (err) {
            console.error('Erro ao atualizar status automaticamente:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao atualizar status' 
            });
        }
        
        res.json({
            success: true,
            message: `${result.affectedRows} agendamentos atualizados para "fora do prazo"`
        });
    });
});


// agendamentoSimples.js - Adicione esta rota

// Rota para buscar último veículo agendado não cancelado do usuário
router.get('/usuario/:usuario_id/ultimo-veiculo', (req, res) => {
    const { usuario_id } = req.params;

    const query = `
        SELECT * FROM agendamento_simples 
        WHERE usuario_id = ? 
        AND status NOT IN ('cancelado', 'fora_prazo')
        AND data_hora <= NOW()
        ORDER BY data_hora DESC 
        LIMIT 1
    `;

    db.query(query, [usuario_id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar último veículo agendado:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar último veículo' 
            });
        }

        if (results.length === 0) {
            return res.json({ 
                success: true, 
                data: null,
                message: 'Nenhum agendamento anterior encontrado' 
            });
        }

        res.json({ 
            success: true, 
            data: results[0] 
        });
    });
});


// agendamentoSimples.js - Adicione esta rota

// Rota para buscar último agendamento concluído do usuário
// NO agendamentoSimples.js - Rota para buscar agendamentos por CLIENTE
router.get("/cliente/:usuario_id", (req, res) => {
    const { usuario_id } = req.params;

    const query = `
        SELECT * FROM agendamento_simples 
        WHERE usuario_id = ?
        ORDER BY data_hora DESC
    `;

    db.query(query, [usuario_id], (err, results) => {
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

// Rota para buscar agendamentos por OFICINA (para admin)
router.get("/oficina/:oficina_id", (req, res) => {
    const { oficina_id } = req.params;

    const query = `
        SELECT * FROM agendamento_simples 
        WHERE oficina_id = ?
        ORDER BY data_hora DESC
    `;

    db.query(query, [oficina_id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar agendamentos da oficina:', err);
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
// ROTA SEPARADA PARA ADMIN - NO agendamentoSimples.js
router.post("/admin", (req, res) => {
    console.log('=== AGENDAMENTO ADMIN RECEBIDO ===');
    console.log('Body completo:', JSON.stringify(req.body, null, 2));

    const {
        protocolo,
        data_hora,
        oficina_nome,
        oficina_endereco,
        oficina_telefone,
        oficina_id, // ← OBRIGATÓRIO para admin
        veiculo,
        servicos,
        total_servico,
        cliente_nome,
        cliente_cpf,
        cliente_telefone,
        cliente_email
        // ← SEM usuario_id para admin
    } = req.body;

    // VALIDAÇÃO ESPECÍFICA PARA ADMIN
    if (!cliente_nome || !cliente_telefone || !data_hora || !oficina_id) {
        console.log('Campos obrigatórios faltando para admin:', {
            cliente_nome: !!cliente_nome,
            cliente_telefone: !!cliente_telefone,
            data_hora: !!data_hora,
            oficina_id: !!oficina_id
        });
        
        return res.status(400).json({ 
            success: false, 
            message: 'Campos obrigatórios para admin: nome, telefone, data/hora e oficina_id',
            campos_recebidos: req.body
        });
    }

    // Usar protocolo gerado ou gerar um novo
    const protocoloFinal = protocolo || gerarCodigoConfirmacao();
    const servicosLimpos = limparServicos(servicos);

    // PREPARAR VALORES PARA ADMIN (sem usuario_id, com oficina_id)
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
        null, // ← usuario_id SEMPRE null para admin
        oficina_id // ← oficina_id OBRIGATÓRIO para admin
    ];

    console.log('Valores para inserção (ADMIN):', values);

    const query = `
        INSERT INTO agendamento_simples (
            protocolo, data_hora, oficina_nome, oficina_endereco, oficina_telefone,
            veiculo, servicos, total_servico, cliente_nome, 
            cliente_cpf, cliente_telefone, cliente_email, usuario_id, oficina_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('❌ Erro MySQL ao salvar agendamento ADMIN:', err);
            console.error('SQL:', err.sql);
            
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao salvar agendamento no banco de dados',
                error: err.sqlMessage || err.message,
                sql: err.sql,
                values: values
            });
        }

        console.log('✅ Agendamento ADMIN salvo com sucesso. ID:', result.insertId);
        
        res.status(201).json({ 
            success: true, 
            agendamento_id: result.insertId,
            codigo_confirmacao: protocoloFinal,
            message: 'Agendamento salvo com sucesso!'
        });
    });
});



// Função para verificar disponibilidade da oficina
function verificarDisponibilidadeOficina(oficina_id, data_hora, callback) {
    const query = `
        SELECT 
            horario_abertura,
            horario_fechamento,
            dias_funcionamento
        FROM oficina 
        WHERE id = ?
    `;
    
    db.query(query, [oficina_id], (err, results) => {
        if (err) return callback(err);
        
        if (results.length === 0) {
            return callback(new Error('Oficina não encontrada'));
        }
        
        const oficina = results[0];
        const dataAgendamento = new Date(data_hora);
        const dayOfWeek = dataAgendamento.getDay();
        const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        const diaSemana = dayNames[dayOfWeek];
        
        // Verificar se a oficina funciona nesse dia
        if (oficina.dias_funcionamento && !oficina.dias_funcionamento.toLowerCase().includes(diaSemana)) {
            return callback(new Error('Oficina não funciona neste dia da semana'));
        }
        
        // Verificar horário de funcionamento
        const horarioAgendamento = dataAgendamento.toTimeString().slice(0, 5);
        if (horarioAgendamento < oficina.horario_abertura || horarioAgendamento > oficina.horario_fechamento) {
            return callback(new Error('Horário fora do funcionamento da oficina'));
        }
        
        callback(null, true);
    });
}

// Modifique a rota POST principal para incluir a validação
router.post("/", (req, res) => {
    console.log('=== DADOS RECEBIDOS NO BACKEND (CLIENTE) ===');
    console.log('Body completo:', JSON.stringify(req.body, null, 2));

    const {
        protocolo,
        data_hora,
        oficina_nome,
        oficina_endereco,
        oficina_telefone,
        oficina_id,
        veiculo,
        servicos,
        total_servico,
        cliente_nome,
        cliente_cpf,
        cliente_telefone,
        cliente_email,
        usuario_id
    } = req.body;

    // VALIDAÇÃO ATUALIZADA
    if (!cliente_nome || !cliente_telefone || !data_hora || !usuario_id || !oficina_id) {
        return res.status(400).json({ 
            success: false, 
            message: 'Campos obrigatórios: nome, telefone, data/hora, usuario_id e oficina_id'
        });
    }

    // Verificar disponibilidade da oficina
    verificarDisponibilidadeOficina(oficina_id, data_hora, (err, disponivel) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        const protocoloFinal = protocolo || gerarCodigoConfirmacao();
        const servicosLimpos = limparServicos(servicos);

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
            usuario_id,
            oficina_id
        ];

        const query = `
            INSERT INTO agendamento_simples (
                protocolo, data_hora, oficina_nome, oficina_endereco, oficina_telefone,
                veiculo, servicos, total_servico, cliente_nome, 
                cliente_cpf, cliente_telefone, cliente_email, usuario_id, oficina_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(query, values, (err, result) => {
            if (err) {
                console.error('❌ Erro MySQL ao salvar agendamento CLIENTE:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro ao salvar agendamento no banco de dados',
                    error: err.sqlMessage || err.message
                });
            }

            console.log('✅ Agendamento CLIENTE salvo com sucesso. ID:', result.insertId);
            
            res.status(201).json({ 
                success: true, 
                agendamento_id: result.insertId,
                codigo_confirmacao: protocoloFinal,
                message: 'Agendamento salvo com sucesso!'
            });
        });
    });
});


// Rota para buscar agendamentos por oficina e data
router.get('/oficina/:oficina_id/data/:data', (req, res) => {
    const { oficina_id, data } = req.params;

    // Validar parâmetros
    if (!oficina_id || !data) {
        return res.status(400).json({
            success: false,
            message: 'Parâmetros oficina_id e data são obrigatórios'
        });
    }

    // A data deve estar no formato YYYY-MM-DD
    const query = `
        SELECT data_hora 
        FROM agendamento_simples 
        WHERE oficina_id = ? 
        AND DATE(data_hora) = ?
        AND status NOT IN ('cancelado', 'fora_prazo')
    `;

    db.query(query, [oficina_id, data], (err, results) => {
        if (err) {
            console.error('Erro ao buscar agendamentos:', err);
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar agendamentos'
            });
        }

        // Extrai os horários (HH:MM) dos agendamentos
        const horariosAgendados = results.map(agendamento => {
            const dataHora = new Date(agendamento.data_hora);
            return dataHora.toTimeString().slice(0, 5); // Formato HH:MM
        });

        res.json({
            success: true,
            data: horariosAgendados
        });
    });
});
module.exports = router;

