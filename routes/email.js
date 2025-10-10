const nodemailer = require('nodemailer');
const router = require('express').Router();

// Configuração do transporter do nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // Você pode usar outro serviço: 'outlook', 'yahoo', etc.
    auth: {
        user: process.env.EMAIL_USER || 'seu-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'toan exyw lnsg mcde' // Use senha de app para Gmail
    }
});

// Rota para enviar email de contato
router.post('/send-contact', async (req, res) => {
    const { name, email, phone, subject, message } = req.body;

    try {
        // Configuração do email
        const mailOptions = {
            from: process.env.EMAIL_USER || 'seu-email@gmail.com',
            to: 'oilsmartoficiall@gmail.com', // Email da OilSmart
            subject: `Contato OilSmart - ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #b49434;">Novo Contato - OilSmart</h2>
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
                        <p><strong>Nome:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Telefone:</strong> ${phone || 'Não informado'}</p>
                        <p><strong>Assunto:</strong> ${subject}</p>
                        <p><strong>Mensagem:</strong></p>
                        <div style="background: white; padding: 15px; border-radius: 5px; margin-top: 10px;">
                            ${message.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    <p style="color: #666; font-size: 12px; margin-top: 20px;">
                        Este email foi enviado através do formulário de contato do site OilSmart.
                    </p>
                </div>
            `
        };

        // Enviar email
        await transporter.sendMail(mailOptions);
        
        res.json({
            success: true,
            message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.'
        });

    } catch (error) {
        console.error('Erro ao enviar email:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao enviar mensagem. Tente novamente mais tarde.'
        });
    }
});

module.exports = router;