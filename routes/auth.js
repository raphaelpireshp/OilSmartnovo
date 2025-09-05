const express = require('express');
const router = express.Router();
const db = require('../database/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = 'oilsmart2025';

// Login
router.post('/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ success: false, message: 'Informe email e senha' });
    }

    db.query('SELECT * FROM usuario WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error('Erro no login:', err);
            return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Usuário não encontrado' });
        }

        const user = results[0];
        
        try {
            const senhaOk = await bcrypt.compare(senha, user.senha);

            if (!senhaOk) {
                return res.status(401).json({ success: false, message: 'Senha incorreta' });
            }

            const token = jwt.sign({
                id: user.id,
                tipo: user.tipo,
                nome: user.nome
            }, SECRET, { expiresIn: '2h' });

            res.json({
                success: true,
                message: 'Login realizado com sucesso',
                token,
                user: {
                    id: user.id,
                    nome: user.nome,
                    email: user.email,
                    tipo: user.tipo
                }
            });
        } catch (error) {
            console.error('Erro ao comparar senhas:', error);
            res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
    });
});

// Registro
router.post('/register', async (req, res) => {
    const { nome, email, senha, tipo, telefone, cpf, endereco, cep, cidade, estado } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ success: false, message: 'Preencha todos os campos obrigatórios' });
    }

    try {
        // Verificar se email já existe
        db.query('SELECT id FROM usuario WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error('Erro ao verificar email:', err);
                return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
            }

            if (results.length > 0) {
                return res.status(400).json({ success: false, message: 'Email já cadastrado. Tente outro' });
            }

            // Criptografar senha
            const senhaCriptografada = await bcrypt.hash(senha, 10);

            // Inserir usuário
            db.query(`INSERT INTO usuario (nome, email, senha, tipo, telefone, cpf, endereco, cep, cidade, estado) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                [nome, email, senhaCriptografada, tipo || 'cliente', telefone, cpf, endereco, cep, cidade, estado], 
                (err, result) => {
                    if (err) {
                        console.error('Erro ao registrar usuário:', err);
                        return res.status(500).json({ success: false, message: 'Erro ao registrar usuário' });
                    }

                    res.status(201).json({ 
                        success: true, 
                        message: 'Usuário registrado com sucesso',
                        userId: result.insertId 
                    });
                }
            );
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

module.exports = router;