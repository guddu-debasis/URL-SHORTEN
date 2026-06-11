const { createLogger, format, transports } = require('winston');

// ─── Winston Logger ───────────────────────────────────────────────
// Outputs structured JSON logs to stdout.
// Promtail reads Docker stdout → ships to Loki → queryable in Grafana.
//
// Log format: { timestamp, level, event, ...fields }
// Query in Grafana: {job="urlshortener-backend"} | json | level="error"

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',

  format: format.combine(
    format.timestamp(),          // Add ISO timestamp
    format.errors({ stack: true }), // Include stack trace on errors
    format.json()                // Output as JSON (Loki loves this)
  ),

  // Always write to stdout — Docker captures this and Promtail ships it to Loki
  transports: [
    new transports.Console(),
  ],
});

// Convenience wrapper: logger.info('event_name', { key: value })
// This creates clean, consistent log entries you can filter in Loki
const wrapLogger = {
  info:  (event, fields = {}) => logger.info({ event, ...fields }),
  warn:  (event, fields = {}) => logger.warn({ event, ...fields }),
  error: (event, fields = {}) => logger.error({ event, ...fields }),
  debug: (event, fields = {}) => logger.debug({ event, ...fields }),
};

module.exports = wrapLogger;
