process.env.JWT_SECRET = 'test-secret-for-jest';

const request = require('supertest');
const app = require('../../app');

describe('POST /api/v1/auth/login', () => {
  test('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alice@example.com' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'anything' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alice@example.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 200 with token and role for valid attendee credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alice@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('role', 'attendee');
    expect(res.body).toHaveProperty('attendee');
    expect(res.body.attendee).toHaveProperty('email', 'alice@example.com');
  });

  test('returns 200 with token and role for valid organizer credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'organizer@example.com', password: 'organizer123' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('organizer');
    expect(typeof res.body.token).toBe('string');
  });

  test('response does not include passwordHash', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alice@example.com', password: 'password123' });
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });
});
