process.env.JWT_SECRET = 'test-secret-for-jest';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');

function makeToken(payload = { id: 'att-1', email: 'alice@example.com', role: 'attendee' }) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// Helper: login and get real token
async function loginAs(email, password) {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.token;
}

describe('POST /api/v1/tickets', () => {
  test('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/v1/tickets')
      .send({ eventId: 'evt-1', quantity: 1 });
    expect(res.status).toBe(401);
  });

  test('returns 400 when eventId is missing', async () => {
    const token = makeToken();
    const res = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 1 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when quantity is not a positive integer', async () => {
    const token = makeToken();
    const res = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId: 'evt-1', quantity: -1 });
    expect(res.status).toBe(400);
  });

  test('returns 400 when quantity exceeds availability (sold-out event)', async () => {
    const token = makeToken();
    const res = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId: 'evt-2', quantity: 1 }); // evt-2 has 0 tickets
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 404 for unknown event', async () => {
    const token = makeToken();
    const res = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId: 'nonexistent', quantity: 1 });
    expect(res.status).toBe(404);
  });

  test('returns 201 with ticket on successful booking and decrements availability', async () => {
    const token = await loginAs('alice@example.com', 'password123');
    // Get initial availability for evt-3
    const eventsBefore = await request(app).get('/api/v1/events');
    const evt3Before = eventsBefore.body.find((e) => e.id === 'evt-3');
    const availBefore = evt3Before.ticketsAvailable;

    const res = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId: 'evt-3', quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.quantity).toBe(2);
    expect(res.body.status).toBe('booked');

    // Verify availability decremented
    const eventsAfter = await request(app).get('/api/v1/events');
    const evt3After = eventsAfter.body.find((e) => e.id === 'evt-3');
    expect(evt3After.ticketsAvailable).toBe(availBefore - 2);
  });

  test('inventory never becomes negative', async () => {
    const token = makeToken();
    const res = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId: 'evt-4', quantity: 99999 });
    expect(res.status).toBe(400);

    const events = await request(app).get('/api/v1/events');
    const evt4 = events.body.find((e) => e.id === 'evt-4');
    expect(evt4.ticketsAvailable).toBeGreaterThanOrEqual(0);
  });
});

describe('GET /api/v1/tickets/my', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/tickets/my');
    expect(res.status).toBe(401);
  });

  test('returns only the authenticated user\'s tickets', async () => {
    const aliceToken = await loginAs('alice@example.com', 'password123');
    const res = await request(app)
      .get('/api/v1/tickets/my')
      .set('Authorization', `Bearer ${aliceToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // All tickets must belong to the alice
    res.body.forEach((t) => expect(t.attendeeId).toBe('att-1'));
  });
});

describe('PATCH /api/v1/tickets/:id/status', () => {
  test('returns 401 without token', async () => {
    const res = await request(app)
      .patch('/api/v1/tickets/tkt-1/status')
      .send({ status: 'cancelled' });
    expect(res.status).toBe(401);
  });

  test('returns 400 for invalid status', async () => {
    const token = makeToken();
    const res = await request(app)
      .patch('/api/v1/tickets/any-id/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'invalidstatus' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 404 for non-existent ticket', async () => {
    const token = makeToken();
    const res = await request(app)
      .patch('/api/v1/tickets/does-not-exist/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'cancelled' });
    expect(res.status).toBe(404);
  });

  test('cancellation restores inventory and prevents double restoration', async () => {
    const aliceToken = await loginAs('alice@example.com', 'password123');

    // Book a ticket
    const bookRes = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ eventId: 'evt-1', quantity: 1 });
    expect(bookRes.status).toBe(201);
    const ticketId = bookRes.body.id;

    // Check availability before cancel
    const beforeRes = await request(app).get('/api/v1/events/evt-1');
    const availBefore = beforeRes.body.ticketsAvailable;

    // Cancel it
    const cancelRes = await request(app)
      .patch(`/api/v1/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ status: 'cancelled' });
    expect(cancelRes.status).toBe(200);

    // Availability should be restored
    const afterRes = await request(app).get('/api/v1/events/evt-1');
    expect(afterRes.body.ticketsAvailable).toBe(availBefore + 1);

    // Cancel again — should NOT double-restore
    await request(app)
      .patch(`/api/v1/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ status: 'cancelled' });

    const afterDouble = await request(app).get('/api/v1/events/evt-1');
    expect(afterDouble.body.ticketsAvailable).toBe(availBefore + 1);
  });

  test('user cannot update another user\'s ticket (403)', async () => {
    // Alice books a ticket
    const aliceToken = await loginAs('alice@example.com', 'password123');
    const bookRes = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ eventId: 'evt-1', quantity: 1 });
    const ticketId = bookRes.body.id;

    // Organizer tries to cancel Alice's ticket
    const orgToken = await loginAs('organizer@example.com', 'organizer123');
    const res = await request(app)
      .patch(`/api/v1/tickets/${ticketId}/status`)
      .set('Authorization', `Bearer ${orgToken}`)
      .send({ status: 'cancelled' });
    expect(res.status).toBe(403);
  });
});
