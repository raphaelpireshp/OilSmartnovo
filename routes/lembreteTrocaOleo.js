const express = require('express');
const router = express.Router();

// "Banco de dados" em memória
let lembretes = [];

// Rota para buscar lembrete do usuário
router.get('/usuario/:usuario_id', (req, res) => {
    const { usuario_id } = req.params;
    
    const lembrete = lembretes.find(l => l.usuario_id === parseInt(usuario_id));
    
    if (!lembrete) {
        return res.json({ 
            success: true, 
            data: null,
            message: 'Nenhum lembrete encontrado'
        });
    }

    res.json({ 
        success: true, 
        data: lembrete
    });
});

// Rota para criar/atualizar lembrete
router.post('/', (req, res) => {
    const {
        usuario_id,
        veiculo_modelo = 'Meu Veículo',
        ultima_troca_km,
        ultima_troca_data,
        proxima_troca_km,
        proxima_troca_data,
        tipo_oleo = 'Óleo semissintético',
        observacoes = ''
    } = req.body;

    if (!usuario_id) {
        return res.status(400).json({
            success: false,
            message: 'Usuário ID é obrigatório'
        });
    }

    // Verifica se já existe lembrete para este usuário
    const index = lembretes.findIndex(l => l.usuario_id === parseInt(usuario_id));
    
    const novoLembrete = {
        id: index >= 0 ? lembretes[index].id : Date.now(),
        usuario_id: parseInt(usuario_id),
        veiculo_modelo,
        ultima_troca_km: ultima_troca_km || 80000,
        ultima_troca_data: ultima_troca_data || '2023-05-15',
        proxima_troca_km: proxima_troca_km || 85000,
        proxima_troca_data: proxima_troca_data || '2023-11-15',
        tipo_oleo,
        observacoes,
        updated_at: new Date().toISOString()
    };

    if (index >= 0) {
        // Atualizar existente
        lembretes[index] = novoLembrete;
    } else {
        // Criar novo
        lembretes.push(novoLembrete);
    }

    res.json({
        success: true,
        message: index >= 0 ? 'Lembrete atualizado com sucesso!' : 'Lembrete criado com sucesso!',
        data: novoLembrete
    });
});

// Rota para dados de exemplo (pré-popular)
router.post('/exemplo/:usuario_id', (req, res) => {
    const { usuario_id } = req.params;
    
    const lembreteExemplo = {
        id: Date.now(),
        usuario_id: parseInt(usuario_id),
        veiculo_modelo: 'Honda Civic 2020',
        ultima_troca_km: 80000,
        ultima_troca_data: '2023-05-15',
        proxima_troca_km: 85000,
        proxima_troca_data: '2023-11-15',
        tipo_oleo: 'Óleo semissintético 10W40',
        observacoes: 'Próxima troca recomendada',
        updated_at: new Date().toISOString()
    };

    // Remove lembrete existente se houver
    lembretes = lembretes.filter(l => l.usuario_id !== parseInt(usuario_id));
    lembretes.push(lembreteExemplo);

    res.json({
        success: true,
        message: 'Lembrete de exemplo criado!',
        data: lembreteExemplo
    });
});

// Rota para deletar lembrete
router.delete('/usuario/:usuario_id', (req, res) => {
    const { usuario_id } = req.params;
    
    const initialLength = lembretes.length;
    lembretes = lembretes.filter(l => l.usuario_id !== parseInt(usuario_id));
    
    if (lembretes.length < initialLength) {
        res.json({
            success: true,
            message: 'Lembrete removido com sucesso!'
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'Lembrete não encontrado'
        });
    }
});

// Rota para listar todos os lembretes (apenas para debug)
router.get('/debug/todos', (req, res) => {
    res.json({
        success: true,
        data: lembretes,
        total: lembretes.length
    });
});

module.exports = router;