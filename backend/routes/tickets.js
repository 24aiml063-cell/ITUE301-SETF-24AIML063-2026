const express = require('express');
const mongoose = require('mongoose');
const authGuard = require('../middleware/authGuard');

const router = express.Router();

// Apply authGuard to all ticket routes
router.use(authGuard);

const ALLOWED_STATUSES = ['booked', 'cancelled', 'used'];

function getModels() {
  if (mongoose.connection.readyState !== 1) return null;
  return {
    Event: require('../models/Event'),
    Ticket: require('../models/Ticket'),
  };
}

function getMemoryStore() {
  return require('../data/store');
}

/**
 * POST /api/v1/tickets
 * Protected — books tickets for an event.
 * Uses atomic findOneAndUpdate to prevent ticketsAvailable going negative.
 * Body: { eventId, quantity }
 * Returns 201 with new ticket on success.
 * Requirements: 4.4, 4.6, 6.5, 6.6
 */
router.post('/', async (req, res, next) => {
  try {
    const { eventId, quantity } = req.body;

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ error: 'eventId is required' });
    }

    const qty = parseInt(quantity, 10);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ error: 'quantity must be a positive integer' });
    }

    const models = getModels();
    if (models) {
      // Mongoose path
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Atomically decrement only if enough tickets are available
      const updatedEvent = await models.Event.findOneAndUpdate(
        { _id: eventId, ticketsAvailable: { $gte: qty } },
        { $inc: { ticketsAvailable: -qty } },
        { new: true }
      );

      if (!updatedEvent) {
        // Either event doesn't exist or not enough availability
        const exists = await models.Event.findById(eventId);
        if (!exists) return res.status(404).json({ error: 'Event not found' });
        return res.status(400).json({
          error: `Insufficient availability. Only ${exists.ticketsAvailable} ticket(s) left.`,
        });
      }

      const ticket = await models.Ticket.create({
        attendeeId: req.user.id,
        eventId,
        quantity: qty,
      });

      return res.status(201).json(ticket);
    }

    // In-memory fallback
    const store = getMemoryStore();
    const event = store.getEventById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (event.ticketsAvailable < qty) {
      return res.status(400).json({
        error: `Insufficient availability. Only ${event.ticketsAvailable} ticket(s) left.`,
      });
    }

    const decremented = store.decrementEventAvailability(eventId, qty);
    if (!decremented) {
      return res.status(400).json({ error: 'Insufficient availability' });
    }

    const ticket = store.createTicket({ attendeeId: req.user.id, eventId, quantity: qty });
    return res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/tickets/my
 * Protected — returns only the authenticated attendee's tickets.
 * Populates attendeeId (name, email) and eventId (title, date, venue).
 * Requirements: 4.4, 6.5
 */
router.get('/my', async (req, res, next) => {
  try {
    const models = getModels();
    if (models) {
      const tickets = await models.Ticket.find({ attendeeId: req.user.id })
        .populate('attendeeId', 'name email')
        .populate('eventId', 'title date venue');
      return res.status(200).json(tickets);
    }
    return res.status(200).json(getMemoryStore().getTicketsByAttendee(req.user.id));
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/tickets/:id/status
 * Protected — updates ticket status (booked | cancelled | used).
 * Restores inventory when cancelling; prevents double-restoration.
 * Requirements: 4.4, 6.5, 6.6
 */
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
      });
    }

    const models = getModels();
    if (models) {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      const ticket = await models.Ticket.findById(id);
      if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

      // Authorization: attendee may only update their own tickets
      if (ticket.attendeeId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const previousStatus = ticket.status;

      // Restore inventory only when transitioning from 'booked' → 'cancelled'
      if (status === 'cancelled' && previousStatus === 'booked') {
        await models.Event.findByIdAndUpdate(ticket.eventId, {
          $inc: { ticketsAvailable: ticket.quantity },
        });
      }

      ticket.status = status;
      await ticket.save();
      return res.status(200).json(ticket);
    }

    // In-memory fallback
    const store = getMemoryStore();
    const ticket = store.getTicketById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (ticket.attendeeId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const previousStatus = ticket.status;
    if (status === 'cancelled' && previousStatus === 'booked') {
      store.incrementEventAvailability(ticket.eventId, ticket.quantity);
    }

    const updated = store.updateTicketStatus(ticket.id, status);
    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
