const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'wbpk-secret';

// Admin login — credentials stored in .env (ADMIN_USERNAME / ADMIN_PASSWORD)
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const validUser = process.env.ADMIN_USERNAME || 'WBPK';
  const validPass = process.env.ADMIN_PASSWORD || 'PK78692';

  if (username !== validUser || password !== validPass) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { username, role: 'ADMIN' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, username, role: 'ADMIN' });
});

// Client login for a specific event (passkey check)
router.post('/event-login', (req, res) => {
  const { eventSlug, password } = req.body;
  const { findEventBySlug } = require('../mockStore');

  const event = findEventBySlug(eventSlug);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  if (event.password && event.password !== password) {
    return res.status(401).json({ error: 'Invalid passkey' });
  }

  const token = jwt.sign(
    { eventId: event.id, role: 'CLIENT' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, event: { id: event.id, name: event.name, slug: event.slug } });
});

module.exports = router;

