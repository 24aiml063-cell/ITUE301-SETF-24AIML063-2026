const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getAttendeeByEmail } = require('../data/store');

const router = express.Router();

/**
 * POST /api/v1/auth/login
 * Public — no authGuard.
 * Body: { email, password }
 * Returns: { token, role, attendee: { id, name, email } }
 * Requirements: 4.4, 4.6, 1.2
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'email is required' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'password is required' });
    }

    const attendee = getAttendeeByEmail(email.trim().toLowerCase());
    if (!attendee) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, attendee.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const token = jwt.sign(
      { id: attendee.id, email: attendee.email, role: attendee.role },
      secret,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      token,
      role: attendee.role,
      attendee: { id: attendee.id, name: attendee.name, email: attendee.email },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
