const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const db = require('../database/db');

// Configuração do transporter do nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'oilsmartoficiall@gmail.com',
        pass: process.env.EMAIL_PASS || 'cyog lhar hnpm plgw'
    }
});

// Verificar conexão com o serviço de email
transporter.verify(function(error, success) {
    if (error) {
        console.error('Erro na configuração do email:', error);
    } else {
        console.log('Servidor de email configurado com sucesso');
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        // Validação básica
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Todos os campos obrigatórios devem ser preenchidos' 
            });
        }

        // Validação de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email inválido'
            });
        }

        const query = `
            INSERT INTO contatos (nome, email, telefone, assunto, mensagem, data_contato)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;
        
        // Salvar no banco de dados
        db.query(query, [name, email, phone, subject, message], (err, results) => {
            if (err) {
                console.error('Erro ao salvar contato no banco:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro ao salvar contato no sistema' 
                });
            }
            
            // Configurar opções do email
            const mailOptions = {
                from: {
                    name: 'OilSmart Contato',
                    address: process.env.EMAIL_USER || 'oilsmartoficiall@gmail.com'
                },
                to: 'oilsmartoficiall@gmail.com',
                subject: `📧 Contato OilSmart: ${subject}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1d3557;">Nova mensagem de contato - OilSmart</h2>
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                            <p><strong>👤 Nome:</strong> ${name}</p>
                            <p><strong>📧 E-mail:</strong> ${email}</p>
                            <p><strong>📞 Telefone:</strong> ${phone || 'Não informado'}</p>
                            <p><strong>📋 Assunto:</strong> ${subject}</p>
                            <p><strong>💬 Mensagem:</strong></p>
                            <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #1d3557;">
                                ${message.replace(/\n/g, '<br>')}
                            </div>
                        </div>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        <p style="color: #666; font-size: 12px;">
                            Enviado em: ${new Date().toLocaleString('pt-BR')}<br>
                            IP: ${req.ip}
                        </p>
                    </div>
                `
            };

            // Enviar email
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Erro ao enviar e-mail:', error);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Erro ao enviar mensagem. Tente novamente mais tarde.' 
                    });
                }
                
                console.log('E-mail enviado com sucesso:', info.messageId);
                res.json({ 
                    success: true, 
                    message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
                    messageId: info.messageId
                });
            });
        });

    } catch (error) {
        console.error('Erro ao processar formulário:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor. Tente novamente mais tarde.' 
        });
    }
});

router.get('/', (req, res) => {
    const query = 'SELECT * FROM contatos ORDER BY data_contato DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar contatos:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json(results);
    });
});

module.exports = router;

// Adicione no contact.js
router.get('/test-email', (req, res) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'oilsmartoficiall@gmail.com',
        subject: 'Teste de Email - OilSmart',
        text: 'Este é um email de teste do sistema OilSmart'
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Erro no teste de email:', error);
            return res.status(500).json({ 
                success: false, 
                error: error.toString() 
            });
        }
        res.json({ 
            success: true, 
            message: 'Email de teste enviado com sucesso',
            messageId: info.messageId 
        });
    });
});