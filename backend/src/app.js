const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const env = require('./config/env');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.resolve(process.cwd(), env.uploadDir)));
app.use('/api', routes);

app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Erro interno do servidor',
  });
});

module.exports = app;
