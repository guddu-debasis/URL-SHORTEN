const express = require('express');
const router = express.Router();
const UAParser = require('ua-parser-js');
const Url = require('../models/Url');

// GET /:code — redirect short URL to original
router.get('/:code', async (req, res) => {
  try {
    const url = await Url.findOne({ shortCode: req.params.code });

    if (!url) return res.status(404).send('URL not found');

    // Check expiry
    if (url.expiresAt && new Date() > url.expiresAt) {
      return res.status(410).send('This link has expired');
    }

    // Parse user agent for device/browser info
    const parser = new UAParser(req.headers['user-agent']);
    const result = parser.getResult();

    // Record click
    url.clicks += 1;
    url.clickData.push({
      ip: req.ip,
      device: result.device.type || 'desktop',
      browser: result.browser.name || 'unknown',
    });
    await url.save();

    // HTTP 302 temporary redirect
    res.redirect(302, url.originalUrl);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
