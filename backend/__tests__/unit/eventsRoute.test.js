process.env.JWT_SECRET = 'test-secret-for-jest';

const request = require('supertest');
const app = require('../../app');

describe('GET /api/v1/events', () => {
  test('is public — no token required', async () => {
    const res = await request(app).get('/api/v1/events');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('returns expected event fields', async () => {
    const res = await request(app).get('/api/v1/events');
    expect(res.status).toBe(200);
    const event = res.body[0];
    expect(event).toHaveProperty('id');
    expect(event).toHaveProperty('title');
    expect(event).toHaveProperty('category');
    expect(event).toHaveProperty('date');
    expect(event).toHaveProperty('venue');
    expect(event).toHaveProperty('ticketsAvailable');
  });
});

describe('GET /api/v1/events/:id', () => {
  test('returns a single event by id', async () => {
    const all = await request(app).get('/api/v1/events');
    const firstId = all.body[0].id;
    const res = await request(app).get(`/api/v1/events/${firstId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(firstId);
  });

  test('returns 404 for unknown event id', async () => {
    const res = await request(app).get('/api/v1/events/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Event not found');
  });
});

describe('API route prefix /api/v1/', () => {
  test('all routes are mounted under /api/v1/', async () => {
    const eventsRes = await request(app).get('/api/v1/events');
    expect(eventsRes.status).toBe(200);

    const authRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alice@example.com', password: 'password123' });
    expect(authRes.status).toBe(200);
  });

  test('routes without /api/v1/ prefix return 404', async () => {
    const res = await request(app).get('/events');
    expect(res.status).toBe(404);
  });
});
