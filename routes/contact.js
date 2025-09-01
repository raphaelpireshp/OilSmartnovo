
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const db = require('../database/db');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'oilsmartoficiall@gmail.com',
        pass: process.env.EMAIL_PASS || 'cyog lhar hnpm plgw'
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

        const query = `
            INSERT INTO contatos (nome, email, telefone, assunto, mensagem, data_contato)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;
        
        db.query(query, [name, email, phone, subject, message], (err, results) => {
            if (err) {
                console.error('Erro ao salvar contato no banco:', err);
            }
            
            const mailOptions = {
                from: process.env.EMAIL_USER || 'oilsmartoficiall@gmail.com',
                to: 'oilsmartoficiall@gmail.com',
                subject: `Contato OilSmart: ${subject}`,
                html: `
                    <h2>Nova mensagem de contato</h2>
                    <p><strong>Nome:</strong> ${name}</p>
                    <p><strong>E-mail:</strong> ${email}</p>
                    <p><strong>Telefone:</strong> ${phone || 'Não informado'}</p>
                    <p><strong>Assunto:</strong> ${subject}</p>
                    <p><strong>Mensagem:</strong></p>
                    <p>${message.replace(/\n/g, '<br>')}</p>
                    <hr>
                    <p>Enviado em: ${new Date().toLocaleString('pt-BR')}</p>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Erro ao enviar e-mail:', error);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Erro ao enviar mensagem. Tente novamente mais tarde.' 
                    });
                }
                
                console.log('E-mail enviado:', info.response);
                res.json({ 
                    success: true, 
                    message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.' 
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
