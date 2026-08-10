const express = require('express');
const db = require('../../database/db');

const router = express.Router();

// ========== ROTA PARA ADICIONAR OFICINA ==========

// Rota para adicionar oficina - VERSÃO CORRIGIDA COM VALIDAÇÃO DE CEP
router.post('/api/oficina', async (req, res) => {
    const {
        nome, email, senha, endereco, cidade, estado, telefone, horario_abertura,
        horario_fechamento, dias_funcionamento, lat, lng, cep
    } = req.body;

    console.log('📝 Dados recebidos para nova oficina:', req.body);

    // Validação dos campos obrigatórios
    if (!nome || !email || !senha || !endereco || !cidade || !estado || !telefone || !cep) {
        return res.status(400).json({ 
            success: false, 
            error: 'Campos obrigatórios faltando: nome, email, senha, endereco, cidade, estado, telefone, cep' 
        });
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            success: false, 
            error: 'Email inválido' 
        });
    }

    // Validação e formatação do CEP
    let cepFormatado = cep.toString().replace(/\D/g, ''); // Remove não dígitos
    
    if (cepFormatado.length > 8) {
        cepFormatado = cepFormatado.substring(0, 8); // Limita a 8 dígitos
    }
    
    if (cepFormatado.length < 8) {
        return res.status(400).json({ 
            success: false, 
            error: 'CEP deve ter 8 dígitos' 
        });
    }

    // Formatar CEP com hífen (opcional)
    // cepFormatado = cepFormatado.replace(/^(\d{5})(\d{3})$/, '$1-$2');

    // Validação de telefone
    const telefoneLimpo = telefone.replace(/\D/g, '');
    if (telefoneLimpo.length < 10) {
        return res.status(400).json({ 
            success: false, 
            error: 'Telefone deve ter pelo menos 10 dígitos' 
        });
    }

    // Limitar telefone a 15 dígitos
    const telefoneFormatado = telefoneLimpo.substring(0, 15);

    try {
        // Primeiro verificar se o email já existe
        const checkEmailQuery = 'SELECT id FROM usuario WHERE email = ?';
        
        const emailResults = await new Promise((resolve, reject) => {
            db.query(checkEmailQuery, [email], (err, results) => {
                if (err) {
                    console.error('❌ Erro ao verificar email:', err);
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });

        if (emailResults.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email já está em uso. Por favor, use outro email.' 
            });
        }

        // Criar o usuário para a oficina
        const usuarioSql = `
            INSERT INTO usuario (nome, email, senha, tipo) 
            VALUES (?, ?, ?, 'oficina')
        `;
        
        // Hash da senha
        const bcrypt = require('bcryptjs');
        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);

        console.log('🔐 Criando usuário...');
        
        const usuarioResult = await new Promise((resolve, reject) => {
            db.query(usuarioSql, [nome, email, senhaHash], (err, result) => {
                if (err) {
                    console.error('❌ Erro ao criar usuário:', err);
                    reject(err);
                } else {
                    console.log('✅ Usuário criado com ID:', result.insertId);
                    resolve(result);
                }
            });
        });

        const usuarioId = usuarioResult.insertId;

        // Criar a oficina com o usuario_id válido
        const oficinaSql = `
            INSERT INTO oficina (
                nome, endereco, cidade, estado, telefone, cep,
                horario_abertura, horario_fechamento, dias_funcionamento, 
                lat, lng, usuario_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        // Converter valores vazios para NULL
        const latValue = (lat && lat !== '') ? parseFloat(lat) : null;
        const lngValue = (lng && lng !== '') ? parseFloat(lng) : null;

        // Validar latitude e longitude
        if (latValue !== null && (isNaN(latValue) || latValue < -90 || latValue > 90)) {
            console.warn('⚠️ Latitude inválida, definindo como null');
            latValue = null;
        }

        if (lngValue !== null && (isNaN(lngValue) || lngValue < -180 || lngValue > 180)) {
            console.warn('⚠️ Longitude inválida, definindo como null');
            lngValue = null;
        }

        const params = [
            nome, 
            endereco, 
            cidade, 
            estado, 
            telefoneFormatado, // Telefone limitado
            cepFormatado,      // CEP formatado
            horario_abertura ? horario_abertura + ':00' : '08:00:00',
            horario_fechamento ? horario_fechamento + ':00' : '18:00:00',
            dias_funcionamento || 'Seg-Sex',
            latValue,
            lngValue,
            usuarioId
        ];

        console.log('🔍 Executando SQL da oficina com parâmetros:', params);

        const oficinaResult = await new Promise((resolve, reject) => {
            db.query(oficinaSql, params, (err, result) => {
                if (err) {
                    console.error('❌ Erro SQL ao inserir oficina:', err);
                    reject(err);
                } else {
                    console.log('✅ Oficina criada com ID:', result.insertId);
                    resolve(result);
                }
            });
        });

        console.log('🎉 Oficina e usuário criados com sucesso!');
        
        res.json({ 
            success: true, 
            id: oficinaResult.insertId, 
            message: 'Oficina e usuário criados com sucesso!' 
        });

    } catch (error) {
        console.error('❌ Erro completo ao adicionar oficina:', error);
        
        // Tratamento específico para erro de tamanho de dados
        if (error.code === 'ER_DATA_TOO_LONG') {
            return res.status(400).json({ 
                success: false, 
                error: 'Dados muito longos para algum campo. Verifique CEP (8 dígitos) e telefone.' 
            });
        }

        // Tratamento específico para erro de range
        if (error.code === 'ER_WARN_DATA_OUT_OF_RANGE') {
            return res.status(400).json({ 
                success: false, 
                error: 'Valores de latitude ou longitude fora do range permitido. Latitude: -90 a 90, Longitude: -180 a 180.' 
            });
        }

        // Tratamento para erro de duplicação de email
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false, 
                error: 'Email já está em uso. Por favor, use outro email.' 
            });
        }

        return res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor ao processar a solicitação'
        });
    }
});

// ========== FIM DA ROTA DE OFICINA ==========



// ========== ROTA PARA BUSCAR OFICINA COM DADOS DO USUÁRIO ==========

// Rota para buscar oficina com dados do usuário
router.get('/api/oficina-completa/:id', (req, res) => {
    const { id } = req.params;
    
    console.log('🔍 Buscando oficina completa ID:', id);
    
    const sql = `
        SELECT 
            o.id, o.nome, o.endereco, o.cidade, o.estado, o.cep, o.telefone,
            o.horario_abertura, o.horario_fechamento, o.dias_funcionamento,
            o.lat, o.lng, o.usuario_id,
            u.email
        FROM oficina o
        LEFT JOIN usuario u ON o.usuario_id = u.id
        WHERE o.id = ?
    `;
    
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('❌ Erro ao buscar oficina completa:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Erro interno do servidor' 
            });
        }
        
        if (results.length === 0) {
            console.log('❌ Oficina não encontrada ID:', id);
            return res.status(404).json({ 
                success: false, 
                message: 'Oficina não encontrada' 
            });
        }
        
        const oficina = results[0];
        console.log('✅ Oficina completa encontrada:', oficina);
        
        res.json({ 
            success: true, 
            oficina: oficina 
        });
    });
});

// ========== FIM DA ROTA DE OFICINA COMPLETA ==========
// ========== ROTA PARA ATUALIZAR OFICINA ==========

// Rota para atualizar oficina
router.put('/api/oficina/:id', async (req, res) => {
    const { id } = req.params;
    const {
        nome, email, senha, endereco, cidade, estado, telefone, horario_abertura,
        horario_fechamento, dias_funcionamento, lat, lng, cep
    } = req.body;

    console.log('🔄 Atualizando oficina ID:', id);
    console.log('📝 Dados recebidos:', req.body);

    // Validação dos campos obrigatórios
    if (!nome || !endereco || !cidade || !estado || !telefone || !cep) {
        return res.status(400).json({ 
            success: false, 
            error: 'Campos obrigatórios faltando: nome, endereco, cidade, estado, telefone, cep' 
        });
    }

    try {
        // Primeiro, buscar a oficina para obter o usuario_id
        const findOficinaSql = 'SELECT usuario_id FROM oficina WHERE id = ?';
        const oficinaResult = await new Promise((resolve, reject) => {
            db.query(findOficinaSql, [id], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        if (oficinaResult.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Oficina não encontrada' 
            });
        }

        const usuarioId = oficinaResult[0].usuario_id;
        console.log('🔍 Usuário ID encontrado:', usuarioId);

        // Atualizar o usuário (email e senha se fornecida)
        if (email) {
            let usuarioSql = 'UPDATE usuario SET email = ?';
            let usuarioParams = [email];

            // Se senha foi fornecida, atualizar também
            if (senha && senha.trim() !== '') {
                console.log('🔑 Atualizando senha do usuário');
                const bcrypt = require('bcryptjs');
                const saltRounds = 10;
                const senhaHash = await bcrypt.hash(senha, saltRounds);
                
                usuarioSql += ', senha = ?';
                usuarioParams.push(senhaHash);
            }

            usuarioSql += ' WHERE id = ?';
            usuarioParams.push(usuarioId);

            await new Promise((resolve, reject) => {
                db.query(usuarioSql, usuarioParams, (err, result) => {
                    if (err) reject(err);
                    else {
                        console.log('✅ Usuário atualizado');
                        resolve(result);
                    }
                });
            });
        }

        // Atualizar a oficina
        const oficinaSql = `
            UPDATE oficina SET
                nome = ?, endereco = ?, cidade = ?, estado = ?, telefone = ?, cep = ?,
                horario_abertura = ?, horario_fechamento = ?, dias_funcionamento = ?, 
                lat = ?, lng = ?, updated_at = NOW()
            WHERE id = ?
        `;
        
        const oficinaParams = [
            nome, endereco, cidade, estado, telefone, cep,
            horario_abertura || '08:00:00',
            horario_fechamento || '18:00:00',
            dias_funcionamento || 'Seg-Sex',
            lat || null,
            lng || null,
            id
        ];

        console.log('🔍 Executando UPDATE da oficina com parâmetros:', oficinaParams);

        const result = await new Promise((resolve, reject) => {
            db.query(oficinaSql, oficinaParams, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Oficina não encontrada' 
            });
        }

        console.log('✅ Oficina atualizada com sucesso!');
        
        res.json({ 
            success: true, 
            message: 'Oficina atualizada com sucesso!' 
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar oficina:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor',
            details: error.message 
        });
    }
});

// ========== FIM DA ROTA DE ATUALIZAÇÃO ==========
// ========== ROTA PARA EXCLUIR OFICINA ==========

// Rota para excluir oficina - VERSÃO COMPLETA
router.delete('/api/oficina/:id', async (req, res) => {
    const { id } = req.params;

    console.log('🗑️ Iniciando exclusão da oficina ID:', id);

    try {
        // Primeiro, buscar a oficina para obter o usuario_id
        const findOficinaSql = 'SELECT usuario_id FROM oficina WHERE id = ?';
        const oficinaResult = await new Promise((resolve, reject) => {
            db.query(findOficinaSql, [id], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        if (oficinaResult.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Oficina não encontrada' 
            });
        }

        const usuarioId = oficinaResult[0].usuario_id;
        console.log('🔍 Usuário ID encontrado:', usuarioId);

        // Iniciar transação para garantir consistência
        await new Promise((resolve, reject) => {
            db.query('START TRANSACTION', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        try {
            // 1. Excluir agendamentos relacionados à oficina
            const deleteAgendamentosSql = 'DELETE FROM agendamento_simples WHERE oficina_id = ?';
            await new Promise((resolve, reject) => {
                db.query(deleteAgendamentosSql, [id], (err, result) => {
                    if (err) reject(err);
                    else {
                        console.log('✅ Agendamentos excluídos:', result.affectedRows);
                        resolve(result);
                    }
                });
            });

            // 2. Excluir estoque relacionado à oficina
            const deleteEstoqueSql = 'DELETE FROM estoque WHERE oficina_id = ?';
            await new Promise((resolve, reject) => {
                db.query(deleteEstoqueSql, [id], (err, result) => {
                    if (err) reject(err);
                    else {
                        console.log('✅ Estoque excluído:', result.affectedRows);
                        resolve(result);
                    }
                });
            });

            // 3. Excluir configurações da oficina
            const deleteConfigSql = 'DELETE FROM oficina_config WHERE oficina_id = ?';
            await new Promise((resolve, reject) => {
                db.query(deleteConfigSql, [id], (err, result) => {
                    if (err) reject(err);
                    else {
                        console.log('✅ Configurações excluídas:', result.affectedRows);
                        resolve(result);
                    }
                });
            });

            // 4. Excluir horários especiais
            const deleteHorariosSql = 'DELETE FROM horarios_especiais WHERE oficina_id = ?';
            await new Promise((resolve, reject) => {
                db.query(deleteHorariosSql, [id], (err, result) => {
                    if (err) reject(err);
                    else {
                        console.log('✅ Horários especiais excluídos:', result.affectedRows);
                        resolve(result);
                    }
                });
            });

            // 5. Excluir capacidade da oficina
            const deleteCapacidadeSql = 'DELETE FROM oficina_capacidade WHERE oficina_id = ?';
            await new Promise((resolve, reject) => {
                db.query(deleteCapacidadeSql, [id], (err, result) => {
                    if (err) reject(err);
                    else {
                        console.log('✅ Capacidade excluída:', result.affectedRows);
                        resolve(result);
                    }
                });
            });

            // 6. Excluir a oficina
            const deleteOficinaSql = 'DELETE FROM oficina WHERE id = ?';
            const oficinaResult = await new Promise((resolve, reject) => {
                db.query(deleteOficinaSql, [id], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            if (oficinaResult.affectedRows === 0) {
                throw new Error('Oficina não encontrada para exclusão');
            }

            // 7. Excluir o usuário associado
            const deleteUsuarioSql = 'DELETE FROM usuario WHERE id = ?';
            await new Promise((resolve, reject) => {
                db.query(deleteUsuarioSql, [usuarioId], (err, result) => {
                    if (err) reject(err);
                    else {
                        console.log('✅ Usuário excluído:', result.affectedRows);
                        resolve(result);
                    }
                });
            });

            // Commit da transação
            await new Promise((resolve, reject) => {
                db.query('COMMIT', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            console.log('✅ Oficina e dados relacionados excluídos com sucesso!');
            
            res.json({ 
                success: true, 
                message: 'Oficina e todos os dados relacionados foram excluídos com sucesso!' 
            });

        } catch (error) {
            // Rollback em caso de erro
            await new Promise((resolve, reject) => {
                db.query('ROLLBACK', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            throw error;
        }

    } catch (error) {
        console.error('❌ Erro ao excluir oficina:', error);
        
        // Verificar se é um erro de chave estrangeira
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
            return res.status(409).json({ 
                success: false, 
                message: 'Não é possível excluir a oficina porque existem agendamentos ou outros registros vinculados a ela. Exclua primeiro os agendamentos relacionados.' 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor ao excluir oficina',
            details: error.message 
        });
    }
});

module.exports = router;
