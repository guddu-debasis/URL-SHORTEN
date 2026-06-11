const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authEventsTotal } = require('../metrics');
const logger = require('../logger');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      logger.warn('register_duplicate_email', { email });
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    authEventsTotal.inc({ type: 'register' });
    logger.info('user_registered', { userId: user._id, email });

    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    logger.error('register_failed', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn('login_user_not_found', { email });
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      logger.warn('login_wrong_password', { email });
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    authEventsTotal.inc({ type: 'login' });
    logger.info('user_logged_in', { userId: user._id, email });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    logger.error('login_failed', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
