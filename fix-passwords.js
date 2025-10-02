const bcrypt = require('bcryptjs');
const db = require('./database/db');

async function fixPasswords() {
    const senhaPadrao = '123456';
    const hash = await bcrypt.hash(senhaPadrao, 10);
    
    console.log('Atualizando senhas das oficinas...');
    console.log('Hash:', hash);
    
    const query = "UPDATE usuario SET senha = ? WHERE tipo = 'oficina'";
    
    db.query(query, [hash], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar senhas:', err);
            return;
        }
        
        console.log(`✅ ${result.affectedRows} senhas atualizadas com sucesso!`);
        console.log('Senha padrão: 123456');
        process.exit();
    });
}

fixPasswords();