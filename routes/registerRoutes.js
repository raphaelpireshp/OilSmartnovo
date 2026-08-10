const adminSessionRoutes = require('./admin/session');
const workshopAvailabilityRoutes = require('./public/workshopAvailability');
const adminAppointmentRoutes = require('./admin/appointments');
const adminDashboardRoutes = require('./admin/dashboard');
const adminReportRoutes = require('./admin/reports');
const authRoutes = require('./auth');
const oficinaRoutes = require('./oficina');
const veiculoRoutes = require('./veiculo');
const marcaRoutes = require('./marca');
const modeloRoutes = require('./modelo');
const modeloAnoRoutes = require('./modeloAno');
const recomendacaoRoutes = require('./recomendacao');
const geocodeRoutes = require('./geocode');
const contactRoutes = require('./contact');
const agendamentoSimplesRoutes = require('./agendamentoSimples');
const emailRoutes = require('./email');
const lembreteTrocaOleoRoutes = require('./lembreteTrocaOleo');
const productManagementRoutes = require('./management/products');
const catalogManagementRoutes = require('./management/catalog');
const workshopManagementRoutes = require('./management/workshops');
const adminSettingsRoutes = require('./admin/settings');
const pageRoutes = require('./pages');
const legacyAdminRoutes = require('./adminRoutes');

function registerRoutes(app) {
    app.use(adminSessionRoutes);
    app.use(workshopAvailabilityRoutes);
    app.use(adminAppointmentRoutes);
    app.use(adminDashboardRoutes);
    app.use(adminReportRoutes);

    app.use('/api/auth', authRoutes);
    app.use('/api/oficina', oficinaRoutes);
    app.use('/api/veiculos', veiculoRoutes);
    app.use('/api/marcas', marcaRoutes);
    app.use('/api/modelos', modeloRoutes);
    app.use('/api/modelo_anos', modeloAnoRoutes);
    app.use('/api/recomendacoes', recomendacaoRoutes);
    app.use('/api/geocode', geocodeRoutes);
    app.use('/api/contact', contactRoutes);
    app.use('/api/agendamento_simples', agendamentoSimplesRoutes);
    app.use('/api/email', emailRoutes);
    app.use('/api/lembretes_troca_oleo', lembreteTrocaOleoRoutes);

    app.use(productManagementRoutes);
    app.use(catalogManagementRoutes);
    app.use(workshopManagementRoutes);
    app.use(adminSettingsRoutes);
    app.use(pageRoutes);
    app.use('/api/admin', legacyAdminRoutes);
}

module.exports = registerRoutes;
