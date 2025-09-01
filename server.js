const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

const db = require('./database/db');

const authRoutes = require('./routes/auth');
const agendamentoRoutes = require('./routes/agendamento');
const oficinaRoutes = require('./routes/oficina');
const veiculoRoutes = require('./routes/veiculo');
const marcaRoutes = require('./routes/marca');
const modeloRoutes = require('./routes/modelo');
const modeloAnoRoutes = require('./routes/modeloAno');
const recomendacaoRoutes = require('./routes/recomendacao');
const geocodeRoutes = require('./routes/geocode');

app.use('/api/auth', authRoutes);
app.use('/api/agendamentos', agendamentoRoutes);
app.use('/api/oficinas', oficinaRoutes);
app.use('/api/veiculos', veiculoRoutes);
app.use('/api/marcas', marcaRoutes);
app.use('/api/modelos', modeloRoutes);
app.use('/api/modelo_anos', modeloAnoRoutes);
app.use('/api/recomendacoes', recomendacaoRoutes);
app.use('/api/geocode', geocodeRoutes);

app.use('/api/contact', require('./routes/contact'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/index.html'));
});

app.get('/api/produtos/oleo/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM produto_oleo WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar óleo:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json(results[0] || null);
    });
});

app.get('/api/produtos/filtro/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM produto_filtro WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar filtro:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json(results[0] || null);
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});