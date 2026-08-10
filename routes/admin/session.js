const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../../database/db');

const router = express.Router();

router.post('/api/admin/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email e senha são obrigatórios' 
        });
    }

    try {
        // Buscar oficina pelo email do usuário
        const query = `
            SELECT u.*, o.id as oficina_id, o.nome as oficina_nome
            FROM usuario u
            JOIN oficina o ON u.id = o.usuario_id
            WHERE u.email = ? AND u.tipo = 'oficina'
        `;
        
        db.query(query, [email], async (err, results) => {
            if (err) {
                console.error('Erro no login:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro interno do servidor' 
                });
            }

            if (results.length === 0) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Credenciais inválidas' 
                });
            }

            const admin = results[0];
            
            // Verificar senha
            const senhaValida = await bcrypt.compare(senha, admin.senha);
            
            if (!senhaValida) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Credenciais inválidas' 
                });
            }

            // Criar sessão
            req.session.admin = {
                id: admin.id,
                nome: admin.nome,
                email: admin.email,
                oficina_id: admin.oficina_id,
                oficina_nome: admin.oficina_nome
            };

            res.json({
                success: true,
                message: 'Login realizado com sucesso',
                admin: req.session.admin
            });
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
    }
});


router.post('/api/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao fazer logout' 
            });
        }
        res.json({ 
            success: true, 
            message: 'Logout realizado com sucesso' 
        });
    });
});

router.get('/api/admin/check-auth', (req, res) => {
    if (req.session.admin) {
        res.json({
            success: true,
            admin: req.session.admin
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Não autenticado'
        });
    }
});


// Rota para agendamentos filtrados - VERSÃO CORRIGIDA

module.exports = router;
