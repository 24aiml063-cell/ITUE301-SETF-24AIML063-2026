process.env.JWT_SECRET = 'test-secret-for-jest';

const request = require('supertest');
const app = require('../../app');

describe('Global error handler', () => {
  test('returns JSON for unhandled errors (not raw stack traces)', async () => {
    // Force an error by sending invalid JSON
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(typeof res.body.error).toBe('string');
  });

  test('404 for unknown routes returns JSON', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  test('response Content-Type is application/json for errors', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});
