const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

function getEventModel() {
  if (mongoose.connection.readyState !== 1) return null;
  return require('../models/Event');
}

function getMemoryStore() {
  return require('../data/store');
}

/**
 * GET /api/v1/events
 * Public — returns array of all events.
 * Requirements: 4.4
 */
router.get('/', async (req, res, next) => {
  try {
    const Event = getEventModel();
    if (Event) {
      const events = await Event.find({});
      return res.status(200).json(events);
    }
    return res.status(200).json(getMemoryStore().getAllEvents());
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/events/:id
 * Public — returns single event or 404.
 * Requirements: 4.4
 */
router.get('/:id', async (req, res, next) => {
  try {
    const Event = getEventModel();
    if (Event) {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Event not found' });
      }
      const event = await Event.findById(id);
      if (!event) return res.status(404).json({ error: 'Event not found' });
      return res.status(200).json(event);
    }
    const event = getMemoryStore().getEventById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    return res.status(200).json(event);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
