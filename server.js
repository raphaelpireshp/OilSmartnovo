const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Conexão com banco
const db = require('./database/db');

// Importar rotas
const authRoutes = require('./routes/auth');
const agendamentoRoutes = require('./routes/agendamento');
const oficinaRoutes = require('./routes/oficina');
const veiculoRoutes = require('./routes/veiculo');
const marcaRoutes = require('./routes/marca');
const modeloRoutes = require('./routes/modelo');
const modeloAnoRoutes = require('./routes/modeloAno');
const recomendacaoRoutes = require('./routes/recomendacao');
const geocodeRoutes = require('./routes/geocode');

// Usar rotas
app.use('/api/auth', authRoutes);
app.use('/api/agendamentos', agendamentoRoutes);
app.use('/api/oficina', oficinaRoutes);
app.use('/api/veiculos', veiculoRoutes);
app.use('/api/marcas', marcaRoutes);
app.use('/api/modelos', modeloRoutes);
app.use('/api/modelo_anos', modeloAnoRoutes);
app.use('/api/recomendacoes', recomendacaoRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/contact', require('./routes/contact'));

// Rotas de produtos (do arquivo novo)
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

// Rotas gerais
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/index.html'));
});

app.get('/api/test', (req, res) => {
    res.json({ message: 'Servidor funcionando!', timestamp: new Date() });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});

// server.js - Modifique a rota de agendamentos
app.post('/api/agendamentos', authenticateToken, async (req, res) => {
    try {
        const {
            cliente_id,
            oficina_id,
            veiculo_id,
            data_agendamento,
            servicos,
            produtos,
            observacoes
        } = req.body;

        // Verificar se o cliente_id corresponde ao usuário logado
        if (cliente_id !== req.user.id) {
            return res.status(403).json({ 
                success: false, 
                message: 'Acesso não autorizado' 
            });
        }

        // Gerar código único de agendamento
        const codigoConfirmacao = 'OS' + Date.now().toString().slice(-8);
        
        const query = `
            INSERT INTO agendamento 
            (cliente_id, oficina_id, veiculo_id, data_agendamento, servicos, produtos, observacoes, codigo_confirmacao, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendente')
        `;
        
        db.query(query, [
            cliente_id,
            oficina_id,
            veiculo_id || null,
            data_agendamento,
            servicos,
            produtos,
            observacoes,
            codigoConfirmacao
        ], (err, result) => {
            if (err) {
                console.error('Erro ao criar agendamento:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro ao criar agendamento' 
                });
            }
            
            res.json({
                success: true,
                message: 'Agendamento criado com sucesso',
                agendamento_id: result.insertId,
                codigo_confirmacao: codigoConfirmacao
            });
        });
    } catch (error) {
        console.error('Erro no agendamento:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
    }
});

// Middleware de autenticação
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token de acesso necessário' 
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'seu_segredo_jwt', (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                message: 'Token inválido' 
            });
        }
        req.user = user;
        next();
    });
}

// server.js - Rota para buscar agendamentos do usuário
app.get('/api/agendamentos/usuario/:userId', (req, res) => {
    const { userId } = req.params;
    
    const query = `
        SELECT a.*, o.nome as oficina_nome, o.endereco as oficina_endereco
        FROM agendamento a
        JOIN oficina o ON a.oficina_id = o.id
        WHERE a.cliente_id = ?
        ORDER BY a.data_agendamento DESC
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar agendamentos:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        
        // Parse dos dados JSON armazenados como texto
        const agendamentos = results.map(ag => ({
            ...ag,
            servicos: JSON.parse(ag.servicos || '{}'),
            produtos: JSON.parse(ag.produtos || '{}')
        }));
        
        res.json(agendamentos);
    });
});