/**
 * In-memory data store for Task 3.
 * In Task 5 this will be replaced by Mongoose models.
 *
 * Seeded with a small set of attendees and events so the API works
 * end-to-end without a running MongoDB instance during Task 3.
 */

const bcrypt = require('bcryptjs');

// ── Attendees ─────────────────────────────────────────────────────────────────
// Passwords are stored as bcrypt hashes (cost factor 10).
// Plain-text passwords for seeded accounts:
//   alice@example.com  →  "password123"
//   organizer@example.com  →  "organizer123"
const attendees = [
  {
    id: 'att-1',
    name: 'Alice Smith',
    email: 'alice@example.com',
    // bcrypt hash of "password123" (cost 4 — fast for dev/test seed data)
    passwordHash: bcrypt.hashSync('password123', 4),
    role: 'attendee',
  },
  {
    id: 'att-2',
    name: 'Bob Organizer',
    email: 'organizer@example.com',
    // bcrypt hash of "organizer123" (cost 4 — fast for dev/test seed data)
    passwordHash: bcrypt.hashSync('organizer123', 4),
    role: 'organizer',
  },
];

// ── Events ────────────────────────────────────────────────────────────────────
let events = [
  {
    id: 'evt-1',
    title: 'Tech Summit 2026',
    category: 'Technology',
    date: '2026-11-15',
    venue: 'Convention Centre, Bengaluru',
    ticketsAvailable: 120,
  },
  {
    id: 'evt-2',
    title: 'Jazz Under the Stars',
    category: 'Music',
    date: '2026-11-22',
    venue: 'Amphitheatre, Mumbai',
    ticketsAvailable: 0,
  },
  {
    id: 'evt-3',
    title: 'Startup Pitch Night',
    category: 'Business',
    date: '2026-12-05',
    venue: 'Innovation Hub, Hyderabad',
    ticketsAvailable: 45,
  },
  {
    id: 'evt-4',
    title: 'Art & Culture Fest',
    category: 'Arts',
    date: '2026-12-18',
    venue: 'Gallery Space, Delhi',
    ticketsAvailable: 200,
  },
];

// ── Tickets ───────────────────────────────────────────────────────────────────
let tickets = [];
let ticketCounter = 1;

// ── Helpers ───────────────────────────────────────────────────────────────────
function getAttendeeByEmail(email) {
  const lower = (email || '').toLowerCase();
  return attendees.find((a) => a.email.toLowerCase() === lower) || null;
}

function getAttendeeById(id) {
  return attendees.find((a) => a.id === id) || null;
}

function getAllEvents() {
  return events;
}

function getEventById(id) {
  return events.find((e) => e.id === id) || null;
}

function createTicket({ attendeeId, eventId, quantity }) {
  const ticket = {
    id: `tkt-${ticketCounter++}`,
    attendeeId,
    eventId,
    quantity,
    bookingDate: new Date().toISOString(),
    status: 'booked',
  };
  tickets.push(ticket);
  return ticket;
}

function getTicketsByAttendee(attendeeId) {
  return tickets.filter((t) => t.attendeeId === attendeeId);
}

function getTicketById(id) {
  return tickets.find((t) => t.id === id) || null;
}

function updateTicketStatus(id, status) {
  const ticket = getTicketById(id);
  if (!ticket) return null;
  ticket.status = status;
  return ticket;
}

function decrementEventAvailability(eventId, quantity) {
  const event = getEventById(eventId);
  if (!event) return false;
  if (event.ticketsAvailable < quantity) return false;
  event.ticketsAvailable -= quantity;
  return true;
}

function incrementEventAvailability(eventId, quantity) {
  const event = getEventById(eventId);
  if (!event) return false;
  event.ticketsAvailable += quantity;
  return true;
}

module.exports = {
  attendees,
  events,
  tickets,
  getAttendeeByEmail,
  getAttendeeById,
  getAllEvents,
  getEventById,
  createTicket,
  getTicketsByAttendee,
  getTicketById,
  updateTicketStatus,
  decrementEventAvailability,
  incrementEventAvailability,
};
