/**
 * Unit tests for Mongoose schemas and database integration.
 * Uses mongodb-memory-server for an in-process MongoDB instance.
 * Requirements: 6.1–6.7
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  // Clear all collections between tests
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

// ── Load models after connection is established ───────────────────────────────
const Attendee = require('../../models/Attendee');
const Event = require('../../models/Event');
const Ticket = require('../../models/Ticket');

// ── Attendee schema tests ─────────────────────────────────────────────────────
describe('Attendee schema', () => {
  const validAttendee = () => ({
    name: 'Alice Smith',
    email: 'alice@example.com',
    passwordHash: bcrypt.hashSync('password123', 4),
    role: 'attendee',
  });

  test('creates a valid attendee document', async () => {
    const doc = await Attendee.create(validAttendee());
    expect(doc._id).toBeDefined();
    expect(doc.email).toBe('alice@example.com');
    expect(doc.role).toBe('attendee');
  });

  test('rejects duplicate email', async () => {
    await Attendee.create(validAttendee());
    await expect(Attendee.create(validAttendee())).rejects.toThrow();
  });

  test('rejects invalid email format', async () => {
    const data = { ...validAttendee(), email: 'not-an-email' };
    await expect(Attendee.create(data)).rejects.toThrow(/valid email/);
  });

  test('rejects invalid role', async () => {
    const data = { ...validAttendee(), role: 'superadmin' };
    await expect(Attendee.create(data)).rejects.toThrow();
  });

  test('rejects missing required fields', async () => {
    await expect(Attendee.create({ email: 'x@x.com' })).rejects.toThrow();
  });

  test('passwordHash is not returned in toJSON output', async () => {
    const doc = await Attendee.create(validAttendee());
    const json = doc.toJSON();
    expect(json).not.toHaveProperty('passwordHash');
  });

  test('passwordHash is excluded from find() results by default', async () => {
    await Attendee.create(validAttendee());
    const found = await Attendee.findOne({ email: 'alice@example.com' });
    expect(found.passwordHash).toBeUndefined();
  });

  test('passwordHash can be selected explicitly', async () => {
    await Attendee.create(validAttendee());
    const found = await Attendee.findOne({ email: 'alice@example.com' }).select('+passwordHash');
    expect(found.passwordHash).toBeDefined();
  });
});

// ── Event schema tests ────────────────────────────────────────────────────────
describe('Event schema', () => {
  const validEvent = () => ({
    title: 'Tech Summit 2026',
    category: 'Technology',
    date: new Date('2026-11-15'),
    venue: 'Convention Centre, Bengaluru',
    ticketsAvailable: 100,
  });

  test('creates a valid event document', async () => {
    const doc = await Event.create(validEvent());
    expect(doc._id).toBeDefined();
    expect(doc.ticketsAvailable).toBe(100);
  });

  test('rejects ticketsAvailable below 0', async () => {
    const data = { ...validEvent(), ticketsAvailable: -1 };
    await expect(Event.create(data)).rejects.toThrow(/cannot be negative/);
  });

  test('allows ticketsAvailable = 0 (sold-out)', async () => {
    const data = { ...validEvent(), ticketsAvailable: 0 };
    const doc = await Event.create(data);
    expect(doc.ticketsAvailable).toBe(0);
  });

  test('rejects missing required fields', async () => {
    await expect(Event.create({ title: 'No Date' })).rejects.toThrow();
  });
});

// ── Ticket schema tests ───────────────────────────────────────────────────────
describe('Ticket schema', () => {
  let attendeeId;
  let eventId;

  beforeEach(async () => {
    const attendee = await Attendee.create({
      name: 'Bob',
      email: 'bob@example.com',
      passwordHash: bcrypt.hashSync('pass', 4),
      role: 'attendee',
    });
    attendeeId = attendee._id;

    const event = await Event.create({
      title: 'Jazz Night',
      category: 'Music',
      date: new Date('2026-12-01'),
      venue: 'Jazz Hall',
      ticketsAvailable: 50,
    });
    eventId = event._id;
  });

  test('creates a valid ticket document', async () => {
    const ticket = await Ticket.create({ attendeeId, eventId, quantity: 2 });
    expect(ticket._id).toBeDefined();
    expect(ticket.status).toBe('booked');
    expect(ticket.bookingDate).toBeDefined();
  });

  test('rejects quantity < 1', async () => {
    await expect(Ticket.create({ attendeeId, eventId, quantity: 0 })).rejects.toThrow();
  });

  test('rejects invalid status', async () => {
    await expect(
      Ticket.create({ attendeeId, eventId, quantity: 1, status: 'invalid' })
    ).rejects.toThrow();
  });

  test('rejects missing attendeeId', async () => {
    await expect(Ticket.create({ eventId, quantity: 1 })).rejects.toThrow();
  });

  test('rejects invalid ObjectId references', async () => {
    const badId = 'not-an-objectid';
    await expect(
      Ticket.create({ attendeeId: badId, eventId, quantity: 1 })
    ).rejects.toThrow();
  });

  test('populates attendeeId with name and email', async () => {
    await Ticket.create({ attendeeId, eventId, quantity: 1 });
    const ticket = await Ticket.findOne({}).populate('attendeeId', 'name email');
    expect(ticket.attendeeId.name).toBe('Bob');
    expect(ticket.attendeeId.email).toBe('bob@example.com');
    expect(ticket.attendeeId.passwordHash).toBeUndefined();
  });

  test('populates eventId with title date venue', async () => {
    await Ticket.create({ attendeeId, eventId, quantity: 1 });
    const ticket = await Ticket.findOne({}).populate('eventId', 'title date venue');
    expect(ticket.eventId.title).toBe('Jazz Night');
    expect(ticket.eventId.venue).toBe('Jazz Hall');
  });
});

// ── Inventory / booking validation tests ────────────────────────────────────
describe('Booking validation and inventory', () => {
  let eventId;

  beforeEach(async () => {
    const attendee = await Attendee.create({
      name: 'Carol',
      email: 'carol@example.com',
      passwordHash: bcrypt.hashSync('pass', 4),
      role: 'attendee',
    });

    const event = await Event.create({
      title: 'Startup Night',
      category: 'Business',
      date: new Date('2026-12-05'),
      venue: 'Innovation Hub',
      ticketsAvailable: 10,
    });
    eventId = event._id;
  });

  test('atomic decrement succeeds when availability is sufficient', async () => {
    const updated = await Event.findOneAndUpdate(
      { _id: eventId, ticketsAvailable: { $gte: 3 } },
      { $inc: { ticketsAvailable: -3 } },
      { new: true }
    );
    expect(updated.ticketsAvailable).toBe(7);
  });

  test('atomic decrement returns null when availability is insufficient (overbooking prevented)', async () => {
    const result = await Event.findOneAndUpdate(
      { _id: eventId, ticketsAvailable: { $gte: 100 } },
      { $inc: { ticketsAvailable: -100 } },
      { new: true }
    );
    expect(result).toBeNull();

    // Event availability must be unchanged
    const unchanged = await Event.findById(eventId);
    expect(unchanged.ticketsAvailable).toBe(10);
  });

  test('ticketsAvailable never goes negative', async () => {
    // Attempt to take more than available
    await Event.findOneAndUpdate(
      { _id: eventId, ticketsAvailable: { $gte: 99 } },
      { $inc: { ticketsAvailable: -99 } },
      { new: true }
    );
    const event = await Event.findById(eventId);
    expect(event.ticketsAvailable).toBeGreaterThanOrEqual(0);
  });

  test('rejected booking creates no Ticket document', async () => {
    const countBefore = await Ticket.countDocuments();
    // Attempt overbooking
    const result = await Event.findOneAndUpdate(
      { _id: eventId, ticketsAvailable: { $gte: 999 } },
      { $inc: { ticketsAvailable: -999 } },
      { new: true }
    );
    expect(result).toBeNull();
    // No ticket created since decrement failed
    const countAfter = await Ticket.countDocuments();
    expect(countAfter).toBe(countBefore);
  });
});
