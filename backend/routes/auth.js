const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * Returns the Attendee Mongoose model when a MongoDB connection is active,
 * otherwise null (falls back to the in-memory store).
 */
function getAttendeeModel() {
  if (mongoose.connection.readyState !== 1) return null;
  return require('../models/Attendee');
}

function getMemoryStore() {
  return require('../data/store');
}

/**
 * POST /api/v1/auth/login
 * Public — no authGuard.
 * Body: { email, password }
 * Returns: { token, role, attendee: { id, name, email } }
 * Authenticates against the Attendee Mongoose collection when connected,
 * or falls back to the in-memory store.
 * Requirements: 4.4, 4.6, 1.2, 6.7
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

    const normalizedEmail = email.trim().toLowerCase();
    let attendeeData = null;

    const Attendee = getAttendeeModel();
    if (Attendee) {
      // Mongoose path — explicitly select passwordHash (it has select:false)
      const doc = await Attendee.findOne({ email: normalizedEmail }).select('+passwordHash');
      if (doc) {
        attendeeData = {
          id: doc._id.toString(),
          name: doc.name,
          email: doc.email,
          passwordHash: doc.passwordHash,
          role: doc.role,
        };
      }
    } else {
      // In-memory fallback (used by Task 3 tests without a live DB)
      attendeeData = getMemoryStore().getAttendeeByEmail(normalizedEmail);
    }

    if (!attendeeData) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, attendeeData.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const token = jwt.sign(
      { id: attendeeData.id, email: attendeeData.email, role: attendeeData.role },
      secret,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      token,
      role: attendeeData.role,
      attendee: { id: attendeeData.id, name: attendeeData.name, email: attendeeData.email },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
