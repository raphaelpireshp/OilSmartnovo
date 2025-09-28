const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

// Importar rotas
const authRoutes = require('./routes/auth');
const agendamentoSimplesRoutes = require('./routes/agendamentoSimples');
const oficinaRoutes = require('./routes/oficina');
const veiculoRoutes = require('./routes/veiculo');
const marcaRoutes = require('./routes/marca');
const modeloRoutes = require('./routes/modelo');
const modeloAnoRoutes = require('./routes/modeloAno');
const recomendacaoRoutes = require('./routes/recomendacao');
const geocodeRoutes = require('./routes/geocode');

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

// Rota para criar agendamento
// app.post('/api/agendamentos', authenticateToken, async (req, res) => {
//     try {
//         const {
//             cliente_id,
//             oficina_id,
//             veiculo_id,
//             data_agendamento,
//             servicos,
//             produtos,
//             observacoes
//         } = req.body;

//         // Verificar se o cliente_id corresponde ao usuário logado
//         if (cliente_id !== req.user.id) {
//             return res.status(403).json({ 
//                 success: false, 
//                 message: 'Acesso não autorizado' 
//             });
//         }

//         // Verificar se a oficina existe e é do tipo correto
//         const oficinaCheck = await new Promise((resolve, reject) => {
//             db.query(`
//                 SELECT o.id, u.tipo 
//                 FROM oficina o 
//                 JOIN usuario u ON o.usuario_id = u.id 
//                 WHERE o.id = ? AND u.tipo = 'oficina'
//             `, [oficina_id], (err, results) => {
//                 if (err) reject(err);
//                 resolve(results);
//             });
//         });

//         if (oficinaCheck.length === 0) {
//             return res.status(404).json({ 
//                 success: false, 
//                 message: 'Oficina não encontrada ou inválida' 
//             });
//         }

//         // Verificar se o veículo pertence ao cliente (se fornecido)
//         if (veiculo_id) {
//             const veiculoCheck = await new Promise((resolve, reject) => {
//                 db.query('SELECT id FROM veiculo WHERE id = ? AND usuario_id = ?', 
//                     [veiculo_id, cliente_id], (err, results) => {
//                     if (err) reject(err);
//                     resolve(results);
//                 });
//             });

//             if (veiculoCheck.length === 0) {
//                 return res.status(404).json({ 
//                     success: false, 
//                     message: 'Veículo não encontrado ou não pertence ao cliente' 
//                 });
//             }
//         }

//         // Gerar código único de agendamento
//         const codigoConfirmacao = 'OS' + Date.now().toString().slice(-8);
        
//         const query = `
//             INSERT INTO agendamento 
//             (cliente_id, oficina_id, veiculo_id, data_agendamento, servicos, produtos, observacoes, codigo_confirmacao, status)
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendente')
//         `;
        
//         const result = await new Promise((resolve, reject) => {
//             db.query(query, [
//                 cliente_id,
//                 oficina_id,
//                 veiculo_id || null,
//                 data_agendamento,
//                 JSON.stringify(servicos || {}),
//                 JSON.stringify(produtos || {}),
//                 observacoes || '',
//                 codigoConfirmacao
//             ], (err, result) => {
//                 if (err) reject(err);
//                 resolve(result);
//             });
//         });
        
//         res.json({
//             success: true,
//             message: 'Agendamento criado com sucesso',
//             agendamento_id: result.insertId,
//             codigo_confirmacao: codigoConfirmacao
//         });
//     } catch (error) {
//         console.error('Erro no agendamento:', error);
//         res.status(500).json({ 
//             success: false, 
//             message: 'Erro interno do servidor' 
//         });
//     }
// });

// Rota para buscar agendamentos do usuário
app.get('/api/agendamentos/usuario/:userId', authenticateToken, (req, res) => {
    const { userId } = req.params;
    
    // Verificar se o usuário está tentando acessar seus próprios agendamentos
    if (parseInt(userId) !== req.user.id) {
        return res.status(403).json({ 
            success: false, 
            message: 'Acesso não autorizado' 
        });
    }
    
    const query = `
        SELECT a.*, o.nome as oficina_nome, o.endereco as oficina_endereco,
               v.placa, m.nome as modelo_nome, ma.nome as marca_nome
        FROM agendamento a
        JOIN oficina o ON a.oficina_id = o.id
        LEFT JOIN veiculo v ON a.veiculo_id = v.id
        LEFT JOIN modelo_ano moano ON v.modelo_ano_id = moano.id
        LEFT JOIN modelo m ON moano.modelo_id = m.id
        LEFT JOIN marca ma ON m.marca_id = ma.id
        WHERE a.cliente_id = ?
        ORDER BY a.data_agendamento DESC
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar agendamentos:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }
        
        // Parse dos dados JSON armazenados como texto
        const agendamentos = results.map(ag => ({
            ...ag,
            servicos: JSON.parse(ag.servicos || '{}'),
            produtos: JSON.parse(ag.produtos || '{}')
        }));
        
        res.json({
            success: true,
            agendamentos: agendamentos
        });
    });
});

// Rota para buscar agendamentos da oficina
app.get('/api/agendamentos/oficina/:oficinaId', authenticateToken, (req, res) => {
    const { oficinaId } = req.params;
    
    // Verificar se o usuário é dono da oficina
    const verificarOficina = `
        SELECT id FROM oficina WHERE id = ? AND usuario_id = ?
    `;
    
    db.query(verificarOficina, [oficinaId, req.user.id], (err, oficinaResults) => {
        if (err) {
            console.error('Erro ao verificar oficina:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Erro interno do servidor' 
            });
        }
        
        if (oficinaResults.length === 0) {
            return res.status(403).json({ 
                success: false, 
                message: 'Acesso não autorizado à esta oficina' 
            });
        }
        
        const query = `
            SELECT a.*, u.nome as cliente_nome, u.telefone as cliente_telefone,
                   v.placa, m.nome as modelo_nome, ma.nome as marca_nome
            FROM agendamento a
            JOIN usuario u ON a.cliente_id = u.id
            LEFT JOIN veiculo v ON a.veiculo_id = v.id
            LEFT JOIN modelo_ano moano ON v.modelo_ano_id = moano.id
            LEFT JOIN modelo m ON moano.modelo_id = m.id
            LEFT JOIN marca ma ON m.marca_id = ma.id
            WHERE a.oficina_id = ?
            ORDER BY a.data_agendamento DESC
        `;
        
        db.query(query, [oficinaId], (err, results) => {
            if (err) {
                console.error('Erro ao buscar agendamentos da oficina:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro interno do servidor' 
                });
            }
            
            // Parse dos dados JSON armazenados como texto
            const agendamentos = results.map(ag => ({
                ...ag,
                servicos: JSON.parse(ag.servicos || '{}'),
                produtos: JSON.parse(ag.produtos || '{}')
            }));
            
            res.json({
                success: true,
                agendamentos: agendamentos
            });
        });
    });
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





module.exports.authenticateToken = authenticateToken;

