const db = require('./database/db');

async function atualizarStatusAgendamentos() {
    const query = `
        UPDATE agendamento_simples 
        SET status = 'fora_prazo' 
        WHERE data_hora < NOW() 
        AND status IN ('pendente', 'confirmado')
    `;
    
    db.query(query, (err, result) => {
        if (err) {
            console.error('Erro ao atualizar status:', err);
            return;
        }
        
        console.log(`Status atualizados: ${result.affectedRows} agendamentos`);
    });
}

// Executar imediatamente e depois a cada hora
atualizarStatusAgendamentos();
setInterval(atualizarStatusAgendamentos, 60 * 60 * 1000);