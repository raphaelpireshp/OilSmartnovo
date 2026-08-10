const express = require('express');
const db = require('../../database/db');

const router = express.Router();

router.get('/api/modelos-completos', (req, res) => {
    const sql = `
        SELECT 
            m.id as id_modelo,
            m.nome as nome_modelo,
            m.tipo,
            ma.id as id_marca,
            ma.nome as nome_marca
        FROM modelo m
        JOIN marca ma ON m.marca_id = ma.id
        ORDER BY ma.nome, m.nome
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar modelos completos:', err);
            return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
        res.json({ success: true, data: results });
    });
});

// Rota para obter anos completos (com nome do modelo e marca) - ADICIONE AQUI
router.get('/api/anos-completos', (req, res) => {
    const sql = `
        SELECT 
            ma.id as id_ano,
            ma.ano,
            m.id as id_modelo,
            m.nome as nome_modelo,
            m.tipo,
            mar.id as id_marca,
            mar.nome as nome_marca
        FROM modelo_ano ma
        JOIN modelo m ON ma.modelo_id = m.id
        JOIN marca mar ON m.marca_id = mar.id
        ORDER BY mar.nome, m.nome, ma.ano
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar anos completos:', err);
            return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
        res.json({ success: true, data: results });
    });
});





// ========== ROTAS PARA MARCAS ==========

// Rota para obter marcas
router.get('/api/marcas', (req, res) => {
    const sql = 'SELECT * FROM marca ORDER BY nome';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar marcas:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json(results);
    });
});




// Rota para adicionar marca
router.post('/api/marca', (req, res) => {
    const { nome } = req.body;
    
    console.log('📝 Adicionando nova marca:', nome);
    
    if (!nome || nome.trim() === '') {
        return res.status(400).json({ 
            success: false, 
            error: 'Nome da marca é obrigatório' 
        });
    }
    
    const sql = 'INSERT INTO marca (nome) VALUES (?)';
    
    db.query(sql, [nome.trim()], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar marca:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
        
        res.json({ 
            success: true, 
            id: result.insertId, 
            message: 'Marca adicionada com sucesso' 
        });
    });
});

// Rota para deletar marca
router.delete('/api/marca/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = 'DELETE FROM marca WHERE id = ?';
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Erro ao deletar marca:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Marca não encontrada' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Marca deletada com sucesso' 
        });
    });
});

//fim da rota  d emarca// ========== ROTAS PARA MODELOS ==========

// Rota para obter modelos
router.get('/api/modelos', (req, res) => {
    const sql = 'SELECT * FROM modelo ORDER BY nome';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar modelos:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json(results);
    });
});

// Rota para adicionar modelo
router.post('/api/modelo', (req, res) => {
    const { nome, marca_id, tipo } = req.body;
    
    console.log('📝 Adicionando novo modelo:', { nome, marca_id, tipo });
    
    if (!nome || !marca_id || !tipo) {
        return res.status(400).json({ 
            success: false, 
            error: 'Nome, marca_id e tipo são obrigatórios' 
        });
    }
    
    const sql = 'INSERT INTO modelo (nome, marca_id, tipo) VALUES (?, ?, ?)';
    
    db.query(sql, [nome.trim(), parseInt(marca_id), tipo], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar modelo:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
        
        res.json({ 
            success: true, 
            id: result.insertId, 
            message: 'Modelo adicionado com sucesso' 
        });
    });
});

// Rota para deletar modelo
router.delete('/api/modelo/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = 'DELETE FROM modelo WHERE id = ?';
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Erro ao deletar modelo:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Modelo não encontrado' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Modelo deletado com sucesso' 
        });
    });
});




// ========== ROTAS PARA ANOS DE MODELO ==========

// Rota para obter anos de modelo
router.get('/api/anos-modelo', (req, res) => {
    const sql = 'SELECT * FROM modelo_ano ORDER BY ano';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar anos de modelo:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json(results);
    });
});

// Rota para adicionar ano de modelo
router.post('/api/ano-modelo', (req, res) => {
    const { modelo_id, ano } = req.body;
    
    console.log('📝 Adicionando novo ano de modelo:', { modelo_id, ano });
    
    if (!modelo_id || !ano) {
        return res.status(400).json({ 
            success: false, 
            error: 'modelo_id e ano são obrigatórios' 
        });
    }
    
    const sql = 'INSERT INTO modelo_ano (modelo_id, ano) VALUES (?, ?)';
    
    db.query(sql, [parseInt(modelo_id), parseInt(ano)], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar ano de modelo:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
        
        res.json({ 
            success: true, 
            id: result.insertId, 
            message: 'Ano de modelo adicionado com sucesso' 
        });
    });
});

// Rota para deletar ano de modelo
router.delete('/api/ano-modelo/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = 'DELETE FROM modelo_ano WHERE id = ?';
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Erro ao deletar ano de modelo:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Ano de modelo não encontrado' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Ano de modelo deletado com sucesso' 
        });
    });
});



// Rota para obter modelo específico
router.get('/api/modelo/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = 'SELECT * FROM modelo WHERE id = ?';
    
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar modelo:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Modelo não encontrado' });
        }
        
        res.json(results[0]);
    });
});

// Rota para atualizar modelo
router.put('/api/modelo/:id', (req, res) => {
    const { id } = req.params;
    const { nome, marca_id, tipo } = req.body;
    
    console.log('🔄 Atualizando modelo ID:', id, 'Dados:', { nome, marca_id, tipo });
    
    if (!nome || !marca_id || !tipo) {
        return res.status(400).json({ 
            success: false, 
            error: 'Nome, marca_id e tipo são obrigatórios' 
        });
    }
    
    const sql = 'UPDATE modelo SET nome = ?, marca_id = ?, tipo = ? WHERE id = ?';
    
    db.query(sql, [nome.trim(), parseInt(marca_id), tipo, id], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar modelo:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Modelo não encontrado' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Modelo atualizado com sucesso' 
        });
    });
});
// Rota para obter ano específico
router.get('/api/ano-modelo/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = 'SELECT * FROM modelo_ano WHERE id = ?';
    
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar ano de modelo:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Ano de modelo não encontrado' });
        }
        
        res.json(results[0]);
    });
});

// Rota para atualizar ano de modelo
router.put('/api/ano-modelo/:id', (req, res) => {
    const { id } = req.params;
    const { modelo_id, ano } = req.body;
    
    console.log('🔄 Atualizando ano ID:', id, 'Dados:', { modelo_id, ano });
    
    if (!modelo_id || !ano) {
        return res.status(400).json({ 
            success: false, 
            error: 'modelo_id e ano são obrigatórios' 
        });
    }
    
    const sql = 'UPDATE modelo_ano SET modelo_id = ?, ano = ? WHERE id = ?';
    
    db.query(sql, [parseInt(modelo_id), parseInt(ano), id], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar ano de modelo:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Ano de modelo não encontrado' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Ano de modelo atualizado com sucesso' 
        });
    });
});

// Rota para obter marca específica - CORREÇÃO DA ROTA FALTANTE
router.get('/api/marca/:id', (req, res) => {
    const { id } = req.params;
    
    console.log('🔍 Buscando marca ID:', id);
    
    const sql = 'SELECT * FROM marca WHERE id = ?';
    
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('❌ Erro ao buscar marca:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        
        if (results.length === 0) {
            console.log('❌ Marca não encontrada ID:', id);
            return res.status(404).json({ error: 'Marca não encontrada' });
        }
        
        console.log('✅ Marca encontrada:', results[0]);
        res.json(results[0]);
    });
});
// Rota para atualizar marca - CORREÇÃO DA ROTA FALTANTE
router.put('/api/marca/:id', (req, res) => {
    const { id } = req.params;
    const { nome } = req.body;
    
    console.log('🔄 Atualizando marca ID:', id, 'Nome:', nome);
    
    if (!nome || nome.trim() === '') {
        return res.status(400).json({ 
            success: false, 
            error: 'Nome da marca é obrigatório' 
        });
    }
    
    const sql = 'UPDATE marca SET nome = ? WHERE id = ?';
    
    db.query(sql, [nome.trim(), id], (err, result) => {
        if (err) {
            console.error('❌ Erro ao atualizar marca:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Marca não encontrada' 
            });
        }
        
        console.log('✅ Marca atualizada com sucesso');
        res.json({ 
            success: true, 
            message: 'Marca atualizada com sucesso' 
        });
    });
});
// Rota para criar recomendação
// Rota para criar recomendação
router.post('/api/recomendacao', (req, res) => {
    const { modelo_ano_id, oleo_id, filtro_id } = req.body;
    
    console.log('🎯 Criando recomendação:', { modelo_ano_id, oleo_id, filtro_id });
    
    const sql = `
        INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
        VALUES (?, ?, ?)
    `;
    
    db.query(sql, [modelo_ano_id, oleo_id, filtro_id], (err, result) => {
        if (err) {
            console.error('Erro ao criar recomendação:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
        
        res.json({ 
            success: true, 
            id: result.insertId, 
            message: 'Recomendação criada com sucesso' 
        });
    });
});

// Rota para buscar óleo específico

module.exports = router;
