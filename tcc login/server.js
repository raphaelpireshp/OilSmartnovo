const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Conexão com banco
const db = require('./database/db');

// Rota de Login
app.post('/api/auth/login', (req, res) => {
    const { email, senha } = req.body;

    console.log('Tentativa de login:', email);

    // Buscar usuário pelo email
    const query = 'SELECT id, nome, email, senha, tipo FROM usuario WHERE email = ?';
    
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Erro no login:', err);
            return res.status(500).json({ success: false, message: 'Erro no servidor' });
        }

        if (results.length === 0) {
            return res.status(400).json({ success: false, message: 'Email ou senha incorretos' });
        }

        const user = results[0];

        try {
            // Verificar senha (comparar com hash no banco)
            const isPasswordValid = await bcrypt.compare(senha, user.senha);
            
            if (!isPasswordValid) {
                return res.status(400).json({ success: false, message: 'Email ou senha incorretos' });
            }

            // Login bem-sucedido
            res.json({
                success: true,
                message: 'Login realizado com sucesso!',
                user: {
                    id: user.id,
                    nome: user.nome,
                    email: user.email,
                    tipo: user.tipo
                }
            });
        } catch (error) {
            console.error('Erro ao verificar senha:', error);
            res.status(500).json({ success: false, message: 'Erro no servidor' });
        }
    });
});

// Rota de logout
app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true, message: 'Logout realizado com sucesso!' });
});

// Rota de Registro
app.post('/api/auth/register', async (req, res) => {
    const { nome, email, senha, telefone, cpf, endereco, cep, cidade, estado } = req.body;

    console.log('Dados recebidos:', req.body); // Para debug

    try {
        // Verificar se o email já existe
        const checkEmailQuery = 'SELECT id FROM usuario WHERE email = ?';
        db.query(checkEmailQuery, [email], async (err, results) => {
            if (err) {
                console.error('Erro ao verificar email:', err);
                return res.status(500).json({ success: false, message: 'Erro no servidor' });
            }

            if (results.length > 0) {
                return res.status(400).json({ success: false, message: 'Este email já está cadastrado' });
            }

            // Criptografar a senha
            const hashedPassword = await bcrypt.hash(senha, 10);

            // Inserir novo usuário (como cliente)
            const insertUserQuery = `
                INSERT INTO usuario (nome, email, senha, tipo, telefone, cpf, endereco, cep, cidade, estado) 
                VALUES (?, ?, ?, 'cliente', ?, ?, ?, ?, ?, ?)
            `;

            db.query(insertUserQuery, 
                [nome, email, hashedPassword, telefone, cpf, endereco, cep, cidade, estado], 
                (err, results) => {
                    if (err) {
                        console.error('Erro ao criar usuário:', err);
                        return res.status(500).json({ success: false, message: 'Erro ao criar usuário' });
                    }

                    res.json({ 
                        success: true, 
                        message: 'Conta criada com sucesso!',
                        userId: results.insertId
                    });
                }
            );
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ success: false, message: 'Erro no servidor' });
    }
});

// Rota de teste simples
app.get('/api/test', (req, res) => {
    res.json({ message: 'Servidor funcionando!', timestamp: new Date() });
});

// Página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});