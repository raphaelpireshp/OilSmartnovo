const app = require('./app');

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
        console.log(`📊 Painel administrativo: http://localhost:${PORT}/admindex.html`);
        console.log(`👤 Painel do cliente: http://localhost:${PORT}/html/index.html`);
        console.log(`🏢 Painel do admin geral: http://localhost:${PORT}/html/admin_geral.html`);
    });
}

module.exports = app;
