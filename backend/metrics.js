const client = require('prom-client');

// Collect default Node.js metrics (memory, CPU, event loop etc.)
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'urlshortener_' });

// ─── Custom Metrics ───────────────────────────────────────────

// Total URLs shortened
const urlsShortenedTotal = new client.Counter({
  name: 'urlshortener_urls_shortened_total',
  help: 'Total number of URLs shortened',
});

// Total redirects
const redirectsTotal = new client.Counter({
  name: 'urlshortener_redirects_total',
  help: 'Total number of short URL redirects',
  labelNames: ['shortCode'],
});

// Total failed redirects (expired or not found)
const redirectFailuresTotal = new client.Counter({
  name: 'urlshortener_redirect_failures_total',
  help: 'Total number of failed redirects',
  labelNames: ['reason'], // 'not_found' or 'expired'
});

// HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'urlshortener_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

// Total auth events
const authEventsTotal = new client.Counter({
  name: 'urlshortener_auth_events_total',
  help: 'Total number of auth events',
  labelNames: ['type'], // 'register' or 'login'
});

module.exports = {
  register: client.register,
  urlsShortenedTotal,
  redirectsTotal,
  redirectFailuresTotal,
  httpRequestDuration,
  authEventsTotal,
};
