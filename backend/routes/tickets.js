const express = require('express');
const authGuard = require('../middleware/authGuard');
const {
  getEventById,
  createTicket,
  getTicketsByAttendee,
  getTicketById,
  updateTicketStatus,
  decrementEventAvailability,
  incrementEventAvailability,
} = require('../data/store');

const router = express.Router();

// Apply authGuard to all ticket routes
router.use(authGuard);

const ALLOWED_STATUSES = ['booked', 'cancelled', 'used'];

/**
 * POST /api/v1/tickets
 * Protected — books tickets for an event.
 * Body: { eventId, quantity }
 * Returns 201 with new ticket on success.
 * Requirements: 4.4, 4.6
 */
router.post('/', (req, res, next) => {
  try {
    const { eventId, quantity } = req.body;

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ error: 'eventId is required' });
    }

    const qty = parseInt(quantity, 10);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ error: 'quantity must be a positive integer' });
    }

    const event = getEventById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.ticketsAvailable < qty) {
      return res.status(400).json({
        error: `Insufficient availability. Only ${event.ticketsAvailable} ticket(s) left.`,
      });
    }

    // Atomically decrement then create ticket (prevents negative inventory)
    const decremented = decrementEventAvailability(eventId, qty);
    if (!decremented) {
      return res.status(400).json({ error: 'Insufficient availability' });
    }

    const ticket = createTicket({
      attendeeId: req.user.id,
      eventId,
      quantity: qty,
    });

    return res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/tickets/my
 * Protected — returns only the authenticated attendee's tickets.
 * Requirements: 4.4
 */
router.get('/my', (req, res) => {
  const myTickets = getTicketsByAttendee(req.user.id);
  return res.status(200).json(myTickets);
});

/**
 * PATCH /api/v1/tickets/:id/status
 * Protected — updates ticket status (booked | cancelled | used).
 * Restores inventory when cancelled (prevents double-restoration).
 * Requirements: 4.4
 */
router.patch('/:id/status', (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
      });
    }

    const ticket = getTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Authorization: attendee may only update their own tickets
    if (ticket.attendeeId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const previousStatus = ticket.status;

    // Prevent double-restoration: only restore inventory if transitioning FROM 'booked'
    if (status === 'cancelled' && previousStatus === 'booked') {
      incrementEventAvailability(ticket.eventId, ticket.quantity);
    }

    const updated = updateTicketStatus(ticket.id, status);
    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
