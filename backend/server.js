const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const { register, httpRequestDuration } = require('./metrics');
const logger = require('./logger');
const urlRoutes = require('./routes/url');
const authRoutes = require('./routes/auth');
const redirectRoute = require('./routes/redirect');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ─── HTTP Request Logger Middleware ──────────────────────────────
// Logs every request as structured JSON → Promtail picks it up → Loki stores it
app.use((req, res, next) => {
  const start = Date.now();
  const end = httpRequestDuration.startTimer();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    end({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode,
    });

    // Structured log — queryable in Grafana/Loki by level, method, status, path
    logger.info('http_request', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration_ms: Math.round(Date.now() - start),
      ip: req.ip,
    });
  });

  next();
});

// ─── Prometheus Metrics Endpoint ─────────────────────────────────
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/url', urlRoutes);
app.use('/', redirectRoute);

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    logger.info('mongodb_connected', { uri: process.env.MONGO_URI });
    app.listen(process.env.PORT, () => {
      logger.info('server_started', { port: process.env.PORT });
    });
  })
  .catch(err => {
    logger.error('mongodb_connection_failed', { error: err.message });
    process.exit(1);
  });
