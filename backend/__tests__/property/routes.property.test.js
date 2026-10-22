process.env.JWT_SECRET = 'test-secret-for-jest';

/**
 * Property-based tests for backend middleware and routes.
 * Uses Jest with manual property-based logic (no fast-check — not in deps).
 * Each property is tagged as required by the task specification.
 * Minimum 100 iterations each.
 * Requirements: 1.2, 1.5, 4.1, 4.2, 4.3, 4.5, 4.6
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');

// ── Helpers ───────────────────────────────────────────────────────────────────
function randomString(length = 8) {
  return Math.random().toString(36).substring(2, 2 + length);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const ITERATIONS = 100;

// ── Property 1: Login with valid credentials returns token and role ────────────
// Feature: eventhub-ticket-booking, Property 1: Login with valid credentials returns token and role
describe('Property 1: Login with valid credentials returns token and role', () => {
  const VALID_CREDENTIALS = [
    { email: 'alice@example.com', password: 'password123', role: 'attendee' },
    { email: 'organizer@example.com', password: 'organizer123', role: 'organizer' },
  ];

  test(`property holds for ${ITERATIONS} iterations`, async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const cred = VALID_CREDENTIALS[i % VALID_CREDENTIALS.length];
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: cred.email, password: cred.password });

      expect(res.status).toBe(200);
      expect(typeof res.body.token).toBe('string');
      expect(res.body.token.length).toBeGreaterThan(0);
      expect(res.body.role).toBe(cred.role);
    }
  }, 60000);
});

// ── Property 3: Login failure displays error message ─────────────────────────
// Feature: eventhub-ticket-booking, Property 3: Login failure displays error message
describe('Property 3: Login failure displays error message', () => {
  test(`property holds for ${ITERATIONS} iterations with random invalid creds`, async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const email = `${randomString()}@${randomString()}.com`;
      const password = randomString(12);
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(typeof res.body.error).toBe('string');
      expect(res.body.error.length).toBeGreaterThan(0);
    }
  }, 60000);
});

// ── Property 7: AuthGuard rejects missing or invalid tokens with 401 ─────────
// Feature: eventhub-ticket-booking, Property 7: AuthGuard rejects missing or invalid tokens with 401
describe('Property 7: AuthGuard rejects missing or invalid tokens with 401', () => {
  const PROTECTED_ENDPOINTS = [
    () => request(app).post('/api/v1/tickets').send({ eventId: 'evt-1', quantity: 1 }),
    () => request(app).get('/api/v1/tickets/my'),
    () => request(app).patch('/api/v1/tickets/tkt-1/status').send({ status: 'cancelled' }),
  ];

  test(`property holds for ${ITERATIONS} iterations with random invalid tokens`, async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const endpointFn = PROTECTED_ENDPOINTS[i % PROTECTED_ENDPOINTS.length];
      const invalidToken = randomString(32);
      const res = await endpointFn().set('Authorization', `Bearer ${invalidToken}`);
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    }
  }, 60000);

  test(`returns 401 for ${ITERATIONS} requests with no Authorization header`, async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const endpointFn = PROTECTED_ENDPOINTS[i % PROTECTED_ENDPOINTS.length];
      const res = await endpointFn();
      expect(res.status).toBe(401);
    }
  }, 60000);
});

// ── Property 8: All API routes are prefixed with /api/v1/ ────────────────────
// Feature: eventhub-ticket-booking, Property 8: All API routes are prefixed with /api/v1/
describe('Property 8: All API routes are prefixed with /api/v1/', () => {
  const ROUTES_WITHOUT_PREFIX = ['/events', '/auth/login', '/tickets', '/tickets/my'];

  test(`property holds: routes without prefix return 404 for ${ITERATIONS} iterations`, async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const route = ROUTES_WITHOUT_PREFIX[i % ROUTES_WITHOUT_PREFIX.length];
      const res = await request(app).get(route);
      expect(res.status).toBe(404);
    }
  }, 60000);
});

// ── Property 9: RequestLogger captures method, URL, and timestamp ─────────────
// Feature: eventhub-ticket-booking, Property 9: RequestLogger captures method, URL, and timestamp for every request
describe('Property 9: RequestLogger captures method, URL, and timestamp for every request', () => {
  test(`property holds for ${ITERATIONS} requests`, async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
      for (let i = 0; i < ITERATIONS; i++) {
        consoleSpy.mockClear();
        await request(app).get('/api/v1/events');
        expect(consoleSpy).toHaveBeenCalledTimes(1);
        const logLine = consoleSpy.mock.calls[0][0];
        expect(logLine).toMatch(/\[GET\]/);
        expect(logLine).toMatch(/\/api\/v1\/events/);
        expect(logLine).toMatch(/\d{4}-\d{2}-\d{2}T/); // ISO timestamp
      }
    } finally {
      consoleSpy.mockRestore();
    }
  }, 60000);
});

// ── Property 10: Unhandled errors produce JSON error responses ───────────────
// Feature: eventhub-ticket-booking, Property 10: Unhandled errors produce JSON error responses
describe('Property 10: Unhandled errors produce JSON error responses', () => {
  test(`property holds for ${ITERATIONS} iterations sending invalid JSON`, async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const badJson = `{ "email": "${randomString()}", invalid }`;
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send(badJson);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.headers['content-type']).toMatch(/application\/json/);
    }
  }, 60000);
});

// ── Property 11: Invalid request bodies return 400 with validation details ────
// Feature: eventhub-ticket-booking, Property 11: Invalid request bodies return 400 with validation details
describe('Property 11: Invalid request bodies return 400 with validation details', () => {
  test(`property holds for ${ITERATIONS} iterations with missing/invalid ticket fields`, async () => {
    const validToken = jwt.sign(
      { id: 'att-1', email: 'alice@example.com', role: 'attendee' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    for (let i = 0; i < ITERATIONS; i++) {
      const invalidBody = i % 2 === 0
        ? { quantity: randomInt(1, 10) }                  // missing eventId
        : { eventId: 'evt-1', quantity: -randomInt(1, 10) }; // negative quantity

      const res = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${validToken}`)
        .send(invalidBody);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    }
  }, 60000);
});
