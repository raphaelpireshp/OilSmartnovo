// routes/adminOficinas.js
const express = require('express');
const router = express.Router();
const db = require('../database/db');
const bcrypt = require('bcryptjs'); // Você já tem o bcryptjs no server.js

// Middleware de autenticação
function requireAuth(req, res, next) {
    if (!req.session.admin) {
        return res.status(401).json({ success: false, message: 'Acesso não autorizado' });
    }
    next();
}

// LISTAR todas as oficinas
router.get('/', requireAuth, (req, res) => {
    const query = `
        SELECT o.*, u.email 
        FROM oficina o 
        JOIN usuario u ON o.usuario_id = u.id
        ORDER BY o.nome
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Erro no servidor' });
        res.json({ success: true, data: results });
    });
});

// CRIAR Oficina (Rota complexa que insere em 'usuario' e 'oficina')
// Exatamente como você pediu: com email, senha, etc.
router.post('/', requireAuth, async (req, res) => {
    const {
        // Dados do Usuario
        email,
        senha,
        cnpj,
        // Dados da Oficina
        nome_oficina,
        cep,
        endereco,
        cidade,
        estado,
        telefone,
        horario_abertura,
        horario_fechamento,
        dias_funcionamento
    } = req.body;

    if (!email || !senha || !nome_oficina) {
        return res.status(400).json({ success: false, message: 'Email, senha e nome da oficina são obrigatórios.' });
    }

    try {
        // 1. Criptografar a senha (igual no seu server.js)
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        // Iniciar transação para garantir que ambos sejam criados
        db.beginTransaction(async (err) => {
            if (err) throw err;

            // 2. Criar o 'usuario'
            const userQuery = `
                INSERT INTO usuario (nome, email, senha, tipo, cnpj) 
                VALUES (?, ?, ?, 'oficina', ?)
            `;
            db.query(userQuery, [nome_oficina, email, senhaHash, cnpj], (err, userResult) => {
                if (err) {
                    db.rollback(() => {
                        console.error("Erro ao criar usuário:", err);
                        res.status(500).json({ success: false, message: 'Erro ao criar usuário. O email ou CNPJ já pode existir.' });
                    });
                    return;
                }

                const novoUsuarioId = userResult.insertId;

                // 3. Criar a 'oficina'
                const oficinaQuery = `
                    INSERT INTO oficina (
                        usuario_id, nome, cep, endereco, cidade, estado, telefone,
                        horario_abertura, horario_fechamento, dias_funcionamento
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                db.query(oficinaQuery, [
                    novoUsuarioId, nome_oficina, cep, endereco, cidade, estado, telefone,
                    horario_abertura, horario_fechamento, dias_funcionamento
                ], (err, oficinaResult) => {
                    if (err) {
                        db.rollback(() => {
                            console.error("Erro ao criar oficina:", err);
                            res.status(500).json({ success: false, message: 'Erro ao criar dados da oficina.' });
                        });
                        return;
                    }

                    // 4. Commit da transação
                    db.commit((err) => {
                        if (err) {
                            db.rollback(() => {
                                console.error("Erro ao commitar:", err);
                                res.status(500).json({ success: false, message: 'Erro ao finalizar a operação.' });
                            });
                            return;
                        }
                        res.json({ success: true, message: 'Oficina criada com sucesso!', id: oficinaResult.insertId });
                    });
                });
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
});

// DELETAR Oficina (Também deleta o 'usuario' associado)
// A sua tabela 'oficina' tem "ON DELETE CASCADE" para 'usuario_id'.
// Isso significa que se deletarmos o USUÁRIO, a OFICINA associada será deletada automaticamente.
router.delete('/:id', requireAuth, (req, res) => {
    const { id } = req.params; // Este é o ID da OFICINA

    // Primeiro, buscar o usuario_id da oficina para deletar ambos
    db.query('SELECT usuario_id FROM oficina WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Erro no servidor' });
        if (results.length === 0) return res.status(404).json({ success: false, message: 'Oficina não encontrada' });

        const usuarioId = results[0].usuario_id;

        // Deletar o 'usuario'. O CASCADE no SQL cuidará de deletar a 'oficina'
        // e tudo relacionado (funcionarios, estoque, etc).
        db.query('DELETE FROM usuario WHERE id = ?', [usuarioId], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Erro ao deletar usuário associado. Verifique as constraints.' });
            }
            res.json({ success: true, message: 'Oficina e usuário associado deletados com sucesso' });
        });
    });
});

// NOTA: A edição de Oficina não foi implementada por ser muito complexa (envolve
// editar tabelas 'usuario' e 'oficina' separadamente). Focamos em Criar, Listar e Deletar.

module.exports = router;