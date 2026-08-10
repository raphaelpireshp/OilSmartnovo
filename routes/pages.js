const express = require('express');
const path = require('path');
const db = require('../database/db');
const projectRoot = path.join(__dirname, '..');

const router = express.Router();

// ========== ROTAS GERAIS ==========

router.get('/', (req, res) => {
    res.sendFile(path.join(projectRoot, 'public/html/index.html'));
});

router.get('/login-adm.html', (req, res) => {
    res.sendFile(path.join(projectRoot, 'public/html/login-adm.html'));
});

router.get('/admindex.html', (req, res) => {
    res.sendFile(path.join(projectRoot, 'public/html/admindex.html'));
});

router.get('/api/test', (req, res) => {
    res.json({ message: 'Servidor funcionando!', timestamp: new Date() });
});

// Rota de teste para verificar a tabela agendamento_simples
router.get('/api/test/agendamento-table', (req, res) => {
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

module.exports = router;
