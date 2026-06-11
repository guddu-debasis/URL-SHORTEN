const express = require('express');
const router = express.Router();
const UAParser = require('ua-parser-js');
const Url = require('../models/Url');
const { redirectsTotal, redirectFailuresTotal } = require('../metrics');
const logger = require('../logger');

// GET /:code — redirect short URL to original
router.get('/:code', async (req, res) => {
  try {
    const url = await Url.findOne({ shortCode: req.params.code });

    if (!url) {
      redirectFailuresTotal.inc({ reason: 'not_found' });
      logger.warn('redirect_not_found', { shortCode: req.params.code, ip: req.ip });
      return res.status(404).send('URL not found');
    }

    // Check expiry
    if (url.expiresAt && new Date() > url.expiresAt) {
      redirectFailuresTotal.inc({ reason: 'expired' });
      logger.warn('redirect_expired', { shortCode: req.params.code, expiresAt: url.expiresAt });
      return res.status(410).send('This link has expired');
    }

    // Parse user agent for device/browser info
    const parser = new UAParser(req.headers['user-agent']);
    const result = parser.getResult();
    const device = result.device.type || 'desktop';
    const browser = result.browser.name || 'unknown';

    // Record click
    url.clicks += 1;
    url.clickData.push({ ip: req.ip, device, browser });
    await url.save();

    // Track redirect in Prometheus
    redirectsTotal.inc({ shortCode: req.params.code });

    logger.info('redirect_success', {
      shortCode: req.params.code,
      originalUrl: url.originalUrl,
      device,
      browser,
      ip: req.ip,
      totalClicks: url.clicks,
    });

    // HTTP 302 temporary redirect
    res.redirect(302, url.originalUrl);
  } catch (err) {
    logger.error('redirect_error', { shortCode: req.params.code, error: err.message });
    res.status(500).send('Server error');
  }
});

module.exports = router;
