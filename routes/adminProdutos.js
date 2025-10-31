// routes/adminProdutos.js
const express = require('express');
const router = express.Router();
const db = require('../database/db'); // Importe sua conexão com o banco

// Middleware de autenticação
// Reutilizando a lógica do seu server.js:
// Só quem já está logado como admin (de qualquer oficina) pode gerenciar produtos.
// Idealmente, você teria um "super-admin" separado, mas vamos usar o que existe.
function requireAuth(req, res, next) {
    if (!req.session.admin) {
        return res.status(401).json({ success: false, message: 'Acesso não autorizado' });
    }
    next();
}

// ========== CRUD PRODUTO_OLEO ==========

// LISTAR Óleos
router.get('/oleo', requireAuth, (req, res) => {
    db.query('SELECT * FROM produto_oleo ORDER BY nome', (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Erro no servidor' });
        res.json({ success: true, data: results });
    });
});

// CRIAR Óleo
router.post('/oleo', requireAuth, (req, res) => {
    // Campos baseados na sua tabela 'produto_oleo'
    const { nome, tipo, viscosidade, especificacao, marca, preco } = req.body;
    const query = `
        INSERT INTO produto_oleo (nome, tipo, viscosidade, especificacao, marca, preco) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [nome, tipo, viscosidade, especificacao, marca, preco], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Erro ao criar produto' });
        res.json({ success: true, message: 'Óleo criado com sucesso', id: result.insertId });
    });
});

// ATUALIZAR Óleo
router.put('/oleo/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const { nome, tipo, viscosidade, especificacao, marca, preco } = req.body;
    const query = `
        UPDATE produto_oleo 
        SET nome = ?, tipo = ?, viscosidade = ?, especificacao = ?, marca = ?, preco = ?
        WHERE id = ?
    `;
    db.query(query, [nome, tipo, viscosidade, especificacao, marca, preco, id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Erro ao atualizar produto' });
        res.json({ success: true, message: 'Óleo atualizado com sucesso' });
    });
});

// DELETAR Óleo
router.delete('/oleo/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM produto_oleo WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Erro ao deletar produto' });
        res.json({ success: true, message: 'Óleo deletado com sucesso' });
    });
});


// ========== CRUD PRODUTO_FILTRO ==========
// Note que 'compatibilidade_modelo' é um campo de texto no seu banco.
// A lógica de vincular a um carro específico (marca/modelo/ano) é feita na tabela 'recomendacao',
// que é um painel muito mais complexo. Este CRUD gerencia a lista MESTRA de produtos.

// LISTAR Filtros
router.get('/filtro', requireAuth, (req, res) => {
    db.query('SELECT * FROM produto_filtro ORDER BY nome', (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Erro no servidor' });
        res.json({ success: true, data: results });
    });
});

// CRIAR Filtro
router.post('/filtro', requireAuth, (req, res) => {
    // Campos baseados na tabela 'produto_filtro'
    const { nome, tipo, compatibilidade_modelo, preco } = req.body;
    const query = `
        INSERT INTO produto_filtro (nome, tipo, compatibilidade_modelo, preco) 
        VALUES (?, ?, ?, ?)
    `;
    db.query(query, [nome, tipo, compatibilidade_modelo, preco], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Erro ao criar filtro' });
        res.json({ success: true, message: 'Filtro criado com sucesso', id: result.insertId });
    });
});

// ATUALIZAR Filtro
router.put('/filtro/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const { nome, tipo, compatibilidade_modelo, preco } = req.body;
    const query = `
        UPDATE produto_filtro 
        SET nome = ?, tipo = ?, compatibilidade_modelo = ?, preco = ?
        WHERE id = ?
    `;
    db.query(query, [nome, tipo, compatibilidade_modelo, preco, id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Erro ao atualizar filtro' });
        res.json({ success: true, message: 'Filtro atualizado com sucesso' });
    });
});

// DELETAR Filtro
router.delete('/filtro/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM produto_filtro WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Erro ao deletar filtro' });
        res.json({ success: true, message: 'Filtro deletado com sucesso' });
    });
});

module.exports = router;