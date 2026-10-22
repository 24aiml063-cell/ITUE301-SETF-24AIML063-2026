const express = require('express');
const { getAllEvents, getEventById } = require('../data/store');

const router = express.Router();

/**
 * GET /api/v1/events
 * Public — returns array of all events.
 * Requirements: 4.4
 */
router.get('/', (req, res) => {
  return res.status(200).json(getAllEvents());
});

/**
 * GET /api/v1/events/:id
 * Public — returns single event or 404.
 * Requirements: 4.4
 */
router.get('/:id', (req, res) => {
  const event = getEventById(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  return res.status(200).json(event);
});

module.exports = router;
