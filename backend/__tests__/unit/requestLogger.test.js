const requestLogger = require('../../middleware/requestLogger');

describe('requestLogger middleware', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  function makeReqRes(method = 'GET', url = '/api/v1/events') {
    const req = { method, originalUrl: url };
    const res = {};
    const next = jest.fn();
    return { req, res, next };
  }

  test('calls next()', () => {
    const { req, res, next } = makeReqRes();
    requestLogger(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('logs [METHOD] [PATH] [TIMESTAMP] format', () => {
    const { req, res, next } = makeReqRes('POST', '/api/v1/auth/login');
    requestLogger(req, res, next);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const logOutput = consoleSpy.mock.calls[0][0];
    expect(logOutput).toMatch(/\[POST\]/);
    expect(logOutput).toMatch(/\/api\/v1\/auth\/login/);
    // Timestamp should be ISO 8601
    expect(logOutput).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  test('logs for every request regardless of route', () => {
    const routes = [
      ['GET', '/api/v1/events'],
      ['POST', '/api/v1/tickets'],
      ['PATCH', '/api/v1/tickets/tkt-1/status'],
      ['GET', '/api/v1/tickets/my'],
    ];
    routes.forEach(([method, url]) => {
      const { req, res, next } = makeReqRes(method, url);
      requestLogger(req, res, next);
    });
    expect(consoleSpy).toHaveBeenCalledTimes(routes.length);
  });

  test('does not log Authorization header', () => {
    const req = {
      method: 'GET',
      originalUrl: '/api/v1/tickets/my',
      headers: { authorization: 'Bearer super-secret-token' },
    };
    const next = jest.fn();
    requestLogger(req, {}, next);
    const logOutput = consoleSpy.mock.calls[0][0];
    expect(logOutput).not.toContain('super-secret-token');
    expect(logOutput).not.toContain('Bearer');
  });
});
