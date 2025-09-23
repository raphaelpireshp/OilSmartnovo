const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Função para gerar código de confirmação único
function gerarCodigoConfirmacao() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `OIL${timestamp}${random}`;
}

router.post('/', (req, res) => {
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
        cliente_email
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

    // PREPARAR VALORES COM VALIDAÇÕES INDIVIDUAIS
    const values = [
        protocoloFinal,
        data_hora || null,
        oficina_nome || 'Oficina não especificada',
        oficina_endereco || 'Endereço não informado',
        oficina_telefone || 'Telefone não informado',
        veiculo ? (typeof veiculo === 'string' ? veiculo : JSON.stringify(veiculo)) : 'Veículo não informado',
        servicos ? (typeof servicos === 'string' ? servicos : JSON.stringify(servicos)) : 'Serviços não especificados',
        parseFloat(total_servico) || 0.00,
        cliente_nome,
        cliente_cpf ? cliente_cpf.replace(/\D/g, '') : 'CPF não informado',
        cliente_telefone,
        cliente_email || 'email@naoinformado.com'
    ];

    console.log('Valores para inserção:', values);

    const query = `
        INSERT INTO agendamento_simples (
            protocolo, data_hora, oficina_nome, oficina_endereco, oficina_telefone,
            veiculo, servicos, total_servico, cliente_nome, cliente_cpf, cliente_telefone, cliente_email
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

// ... resto do código permanece igual

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
router.get('/cliente/:cliente_email', (req, res) => {
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

// Rota para buscar todos os agendamentos
router.get('/', (req, res) => {
    const query = `
        SELECT * FROM agendamento_simples 
        ORDER BY data_hora DESC
    `;

    db.query(query, [], (err, results) => {
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

module.exports = router;