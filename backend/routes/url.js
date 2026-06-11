const express = require('express');
const router = express.Router();
const { customAlphabet } = require('nanoid');
const QRCode = require('qrcode');
const Url = require('../models/Url');
const authMiddleware = require('../middleware/auth');
const { urlsShortenedTotal } = require('../metrics');
const logger = require('../logger');

// Generate a 6-char short code using safe characters
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

// POST /api/url/shorten — shorten a URL (auth optional)
router.post('/shorten', async (req, res) => {
  const { originalUrl, alias, expiresIn } = req.body;

  // Basic URL validation
  try { new URL(originalUrl); } catch {
    logger.warn('shorten_invalid_url', { originalUrl });
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    // Check custom alias collision
    if (alias) {
      const exists = await Url.findOne({ shortCode: alias });
      if (exists) {
        logger.warn('shorten_alias_taken', { alias });
        return res.status(400).json({ error: 'Alias already taken' });
      }
    }

    const shortCode = alias || nanoid();

    // Calculate expiry date
    let expiresAt = null;
    if (expiresIn === '1d') expiresAt = new Date(Date.now() + 86400000);
    else if (expiresIn === '7d') expiresAt = new Date(Date.now() + 7 * 86400000);
    else if (expiresIn && !isNaN(Date.parse(expiresIn))) expiresAt = new Date(expiresIn);

    // Get userId if token is present
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        userId = decoded.id;
      } catch {}
    }

    const url = await Url.create({ originalUrl, shortCode, alias: alias || null, userId, expiresAt });

    // Increment Prometheus counter
    urlsShortenedTotal.inc();

    const shortUrl = `${process.env.BASE_URL}/${shortCode}`;

    // Generate QR code as base64
    const qrCode = await QRCode.toDataURL(shortUrl);

    logger.info('url_shortened', {
      shortCode,
      originalUrl,
      userId: userId || 'anonymous',
      expiresAt: expiresAt || 'never',
    });

    res.status(201).json({ shortUrl, shortCode, qrCode, expiresAt });
  } catch (err) {
    logger.error('shorten_failed', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/url/my-urls — get all URLs for logged-in user
router.get('/my-urls', authMiddleware, async (req, res) => {
  try {
    const urls = await Url.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(urls);
  } catch (err) {
    logger.error('my_urls_fetch_failed', { userId: req.user.id, error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/url/analytics/:code — get analytics for a short URL
router.get('/analytics/:code', async (req, res) => {
  try {
    const url = await Url.findOne({ shortCode: req.params.code });
    if (!url) {
      logger.warn('analytics_not_found', { shortCode: req.params.code });
      return res.status(404).json({ error: 'URL not found' });
    }

    res.json({
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
      clicks: url.clicks,
      clickData: url.clickData,
      createdAt: url.createdAt,
      expiresAt: url.expiresAt,
    });
  } catch (err) {
    logger.error('analytics_fetch_failed', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/url/:code — delete a short URL (auth required)
router.delete('/:code', authMiddleware, async (req, res) => {
  try {
    const url = await Url.findOne({ shortCode: req.params.code, userId: req.user.id });
    if (!url) {
      logger.warn('delete_not_found', { shortCode: req.params.code, userId: req.user.id });
      return res.status(404).json({ error: 'URL not found or not yours' });
    }

    await url.deleteOne();
    logger.info('url_deleted', { shortCode: req.params.code, userId: req.user.id });
    res.json({ message: 'URL deleted' });
  } catch (err) {
    logger.error('delete_failed', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
