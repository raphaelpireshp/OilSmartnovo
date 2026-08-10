const express = require('express');
const db = require('../../database/db');

const router = express.Router();

// ========== NOVAS ROTAS PARA ADMIN GERAL ==========

// Rota para obter produtos (óleos e filtros) - ADICIONE AQUI
router.get('/api/produtos/oleo', (req, res) => {
    const sql = 'SELECT * FROM produto_oleo ORDER BY nome';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar óleos:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json(results);
    });
});

router.get('/api/produtos/filtro', (req, res) => {
    const sql = 'SELECT * FROM produto_filtro ORDER BY nome';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar filtros:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json(results);
    });
});

// Rota para adicionar óleo - ADICIONE AQUI
router.post('/api/produtos/oleo', (req, res) => {
    const { nome, tipo, viscosidade, especificacao, marca, preco } = req.body;
    
    const sql = `
        INSERT INTO produto_oleo (nome, tipo, viscosidade, especificacao, marca, preco)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    db.query(sql, [nome, tipo, viscosidade, especificacao, marca, preco], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar óleo:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json({ success: true, id: result.insertId, message: 'Óleo adicionado com sucesso' });
    });
});

// Rota para adicionar filtro - VERSÃO CORRIGIDA (SEM modelo_ano_id)
router.post('/api/produtos/filtro', (req, res) => {
    const { nome, tipo, compatibilidade_modelo, preco } = req.body;
    
    const sql = `
        INSERT INTO produto_filtro (nome, tipo, compatibilidade_modelo, preco)
        VALUES (?, ?, ?, ?)
    `;
    
    db.query(sql, [nome, tipo, compatibilidade_modelo, preco], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar filtro:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json({ success: true, id: result.insertId, message: 'Filtro adicionado com sucesso' });
    });
});

// Rota para obter modelos completos (com nome da marca) - ADICIONE AQUI

router.get('/api/produtos/oleo/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = 'SELECT * FROM produto_oleo WHERE id = ?';
    
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar óleo:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Óleo não encontrado' });
        }
        
        res.json(results[0]);
    });
});

// Rota para buscar filtro específico
router.get('/api/produtos/filtro/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = 'SELECT * FROM produto_filtro WHERE id = ?';
    
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar filtro:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Filtro não encontrado' });
        }
        
        res.json(results[0]);
    });
});
// ========== ROTAS PARA DELETAR PRODUTOS ==========

// Rota para deletar óleo
router.delete('/api/produtos/oleo/:id', (req, res) => {
    const { id } = req.params;
    
    console.log('🗑️ Deletando óleo ID:', id);
    
    const sql = 'DELETE FROM produto_oleo WHERE id = ?';
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('❌ Erro ao deletar óleo:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Óleo não encontrado' 
            });
        }
        
        console.log('✅ Óleo deletado com sucesso');
        res.json({ 
            success: true, 
            message: 'Óleo deletado com sucesso' 
        });
    });
});

// Rota para deletar filtro
router.delete('/api/produtos/filtro/:id', (req, res) => {
    const { id } = req.params;
    
    console.log('🗑️ Deletando filtro ID:', id);
    
    const sql = 'DELETE FROM produto_filtro WHERE id = ?';
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('❌ Erro ao deletar filtro:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Filtro não encontrado' 
            });
        }
        
        console.log('✅ Filtro deletado com sucesso');
        res.json({ 
            success: true, 
            message: 'Filtro deletado com sucesso' 
        });
    });
});

// Rota para atualizar óleo
router.put('/api/produtos/oleo/:id', (req, res) => {
    const { id } = req.params;
    const { nome, tipo, viscosidade, especificacao, marca, preco } = req.body;
    
    console.log('🔄 Atualizando óleo ID:', id, 'Dados:', req.body);
    
    if (!nome || !tipo || !viscosidade || !especificacao || !marca || !preco) {
        return res.status(400).json({ 
            success: false, 
            error: 'Todos os campos são obrigatórios' 
        });
    }
    
    const sql = `
        UPDATE produto_oleo 
        SET nome = ?, tipo = ?, viscosidade = ?, especificacao = ?, marca = ?, preco = ?
        WHERE id = ?
    `;
    
    db.query(sql, [nome, tipo, viscosidade, especificacao, marca, preco, id], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar óleo:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Óleo não encontrado' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Óleo atualizado com sucesso' 
        });
    });
});

// Rota para atualizar filtro
router.put('/api/produtos/filtro/:id', (req, res) => {
    const { id } = req.params;
    const { nome, tipo, compatibilidade_modelo, preco } = req.body;
    
    console.log('🔄 Atualizando filtro ID:', id, 'Dados:', req.body);
    
    if (!nome || !tipo || !compatibilidade_modelo || !preco) {
        return res.status(400).json({ 
            success: false, 
            error: 'Todos os campos são obrigatórios' 
        });
    }
    
    const sql = `
        UPDATE produto_filtro 
        SET nome = ?, tipo = ?, compatibilidade_modelo = ?, preco = ?
        WHERE id = ?
    `;
    
    db.query(sql, [nome, tipo, compatibilidade_modelo, preco, id], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar filtro:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Filtro não encontrado' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Filtro atualizado com sucesso' 
        });
    });
});

module.exports = router;
