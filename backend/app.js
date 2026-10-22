require('dotenv').config();
const express = require('express');
const cors = require('cors');

const requestLogger = require('./middleware/requestLogger');
const authRouter = require('./routes/auth');
const eventsRouter = require('./routes/events');
const ticketsRouter = require('./routes/tickets');

const app = express();

// ── Middleware stack (order matters) ─────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(requestLogger); // runs for every request, before routes

// ── Routes (all under /api/v1/) ───────────────────────────────────────────────
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/events', eventsRouter);
app.use('/api/v1/tickets', ticketsRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Global error-handling middleware ─────────────────────────────────────────
// Must be registered last with four arguments (err, req, res, next).
// Returns structured JSON; never exposes raw stack traces in production.
// Requirements: 4.5
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Handle malformed JSON bodies
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : (err.message || 'Internal server error');

  return res.status(status).json({ error: message });
});

module.exports = app;
