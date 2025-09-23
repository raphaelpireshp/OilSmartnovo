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
    const {
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
        data_hora
    } = req.body;

    // Validação básica
    if (!oficina_nome || !cliente_nome || !cliente_cpf || !cliente_telefone || !cliente_email || !data_hora) {
        return res.status(400).json({ 
            success: false, 
            message: 'Campos obrigatórios: oficina_nome, cliente_nome, cliente_cpf, cliente_telefone, cliente_email, data_hora' 
        });
    }

    // Gerar código de confirmação único
    const protocolo = gerarCodigoConfirmacao();

    const query = `
        INSERT INTO agendamento_simples (
            protocolo, data_hora, oficina_nome, oficina_endereco, oficina_telefone,
            veiculo, servicos, total_servico, cliente_nome, cliente_cpf, cliente_telefone, cliente_email
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // CÓDIGO CORRIGIDO: O array de valores deve ter exatamente 12 itens
    const values = [
        protocolo,
        data_hora,
        oficina_nome,
        oficina_endereco,
        oficina_telefone,
        JSON.stringify(veiculo), // Adicione veiculo aqui, convertido para JSON
        JSON.stringify(servicos), // Adicione servicos aqui, convertido para JSON
        total_servico,
        cliente_nome,
        cliente_cpf,
        cliente_telefone,
        cliente_email
    ];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Erro ao salvar agendamento:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao salvar agendamento no banco de dados',
                error: err.message 
            });
        }

        res.status(201).json({ 
            success: true, 
            agendamento_id: result.insertId,
            codigo_confirmacao: protocolo,
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