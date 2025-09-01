const express = require('express');
const router = express.Router();
const db = require('../database/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Chave secreta para gerar token (use no .env em produção)
const SECRET = 'oilsmart2025';

// Login
router.post('/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: 'Informe email e senha' });
    }

    db.query('SELECT * FROM usuario WHERE email = ?', [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ erro: 'Usuário não encontrado' });
        }

        const user = results[0];
        const senhaOk = await bcrypt.compare(senha, user.senha);

        if (!senhaOk) {
            return res.status(401).json({ erro: 'Senha incorreta' });
        }

        const token = jwt.sign({
            id: user.id,
            tipo: user.tipo,
            nome: user.nome
        }, SECRET, { expiresIn: '2h' });

        res.json({
            mensagem: 'Login realizado',
            token,
            usuario: {
                id: user.id,
                nome: user.nome,
                tipo: user.tipo
            }
        });
    });
});

// Registro
router.post('/registro', async (req, res) => {
    const { nome, email, senha, tipo } = req.body;

    if (!nome || !email || !senha || !tipo) {
        return res.status(400).json({ erro: 'Preencha todos os campos' });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    db.query('INSERT INTO usuario (nome, email, senha, tipo) VALUES (?, ?, ?, ?)', 
        [nome, email, senhaCriptografada, tipo], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ erro: 'Erro ao registrar usuário' });
            }

            res.status(201).json({ mensagem: 'Usuário registrado com sucesso' });
        }
    );
});

module.exports = router;
