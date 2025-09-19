const express = require('express');
const router = express.Router();
const db = require('../database/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const SECRET = 'oilsmart2025';

// Configuração do email (use Ethereal para teste)
async function createTransporter() {
    // Para teste com Ethereal (email fake)
    let testAccount = await nodemailer.createTestAccount();
    
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    });
}

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
            db.query(`INSERT INTO usuario (nome, email, senha) 
                     VALUES (?, ?, ?)`, 
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

// Esqueci a senha
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Informe o e-mail' });
    }

    try {
        // Verificar se o email existe
        db.query('SELECT * FROM usuario WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error('Erro ao verificar email:', err);
                return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
            }

            if (results.length === 0) {
                // Por segurança, não revelar se o email existe ou não
                return res.json({ 
                    success: true, 
                    message: 'Se o email estiver cadastrado, você receberá instruções de recuperação' 
                });
            }

            const user = results[0];
            
            // Gerar token de recuperação
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = Date.now() + 3600000; // 1 hora

            // Salvar token no banco
            db.query('UPDATE usuario SET reset_token = ?, reset_token_expiry = ? WHERE id = ?', 
                [resetToken, resetTokenExpiry, user.id], 
                async (err) => {
                    if (err) {
                        console.error('Erro ao salvar token:', err);
                        return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
                    }

                    try {
                        // Criar transporter
                        const transporter = await createTransporter();
                        
                        // Enviar email
                        const resetLink = `http://localhost:3000/html/redefinir-senha.html?token=${resetToken}`;
                        
                        const mailOptions = {
                            to: email,
                            subject: 'Recuperação de Senha - OilSmart',
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                    <h2 style="color: #213f57;">Recuperação de Senha - OilSmart</h2>
                                    <p>Você solicitou a redefinição de sua senha. Clique no link abaixo para criar uma nova senha:</p>
                                    <div style="text-align: center; margin: 20px 0;">
                                        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #213f57; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Redefinir Senha</a>
                                    </div>
                                    <p>Este link expira em 1 hora.</p>
                                    <p>Se você não solicitou esta redefinição, ignore este email.</p>
                                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                                    <p style="color: #b49434; font-size: 12px;">Equipe OilSmart</p>
                                </div>
                            `
                        };

                        const info = await transporter.sendMail(mailOptions);
                        console.log('Email enviado:', nodemailer.getTestMessageUrl(info));

                        res.json({ 
                            success: true, 
                            message: 'Se o email estiver cadastrado, você receberá instruções de recuperação' 
                        });
                    } catch (emailError) {
                        console.error('Erro ao enviar email:', emailError);
                        
                        // Para desenvolvimento: retornar o link no console
                        const resetLink = `http://localhost:3000/redefinir-senha.html?token=${resetToken}`;
                        console.log('Link de recuperação (para teste):', resetLink);
                        
                        res.json({ 
                            success: true, 
                            message: 'Email de recuperação gerado (ver console para detalhes)',
                            testLink: resetLink // Apenas para desenvolvimento
                        });
                    }
                }
            );
        });
    } catch (error) {
        console.error('Erro no processo de recuperação:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Redefinir senha
router.post('/reset-password', async (req, res) => {
    const { token, senha } = req.body;

    if (!token || !senha) {
        return res.status(400).json({ success: false, message: 'Token e senha são obrigatórios' });
    }

    if (senha.length < 6) {
        return res.status(400).json({ success: false, message: 'A senha deve ter pelo menos 6 caracteres' });
    }

    try {
        // Buscar usuário pelo token válido
        db.query('SELECT * FROM usuario WHERE reset_token = ? AND reset_token_expiry > ?', 
            [token, Date.now()], 
            async (err, results) => {
                if (err) {
                    console.error('Erro ao verificar token:', err);
                    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
                }

                if (results.length === 0) {
                    return res.status(400).json({ success: false, message: 'Token inválido ou expirado' });
                }

                const user = results[0];
                
                try {
                    // Criptografar nova senha
                    const senhaCriptografada = await bcrypt.hash(senha, 10);

                    // Atualizar senha e limpar token
                    db.query('UPDATE usuario SET senha = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?', 
                        [senhaCriptografada, user.id], 
                        (err, result) => {
                            if (err) {
                                console.error('Erro ao atualizar senha:', err);
                                return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
                            }

                            res.json({ success: true, message: 'Senha redefinida com sucesso' });
                        }
                    );
                } catch (hashError) {
                    console.error('Erro ao criptografar senha:', hashError);
                    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
                }
            }
        );
    } catch (error) {
        console.error('Erro no processo de redefinição:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Verificar token de redefinição
router.get('/verify-reset-token/:token', (req, res) => {
    const { token } = req.params;

    db.query('SELECT id FROM usuario WHERE reset_token = ? AND reset_token_expiry > ?', 
        [token, Date.now()], 
        (err, results) => {
            if (err) {
                console.error('Erro ao verificar token:', err);
                return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
            }

            if (results.length === 0) {
                return res.status(400).json({ success: false, message: 'Token inválido ou expirado' });
            }

            res.json({ success: true, message: 'Token válido' });
        }
    );
});

module.exports = router;