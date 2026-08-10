const path = require('path');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const sessionConfig = require('./config/session');
const registerRoutes = require('./routes/registerRoutes');
const apiNotFound = require('./middlewares/apiNotFound');
const { isValidDayForWorkshop } = require('./utils/workshopSchedule');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session(sessionConfig));

registerRoutes(app);

app.isValidDayForWorkshop = isValidDayForWorkshop;
app.use(apiNotFound);

module.exports = app;
