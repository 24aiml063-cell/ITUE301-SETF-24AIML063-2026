process.env.JWT_SECRET = 'test-secret-for-jest';

const jwt = require('jsonwebtoken');
const authGuard = require('../../middleware/authGuard');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function validToken(payload = { id: 'att-1', email: 'a@b.com', role: 'attendee' }) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('authGuard middleware', () => {
  test('returns 401 when Authorization header is missing', () => {
    const req = { headers: {} };
    const res = makeRes();
    const next = jest.fn();
    authGuard(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when token is malformed', () => {
    const req = { headers: { authorization: 'Bearer bad.token.here' } };
    const res = makeRes();
    const next = jest.fn();
    authGuard(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when Authorization scheme is not Bearer', () => {
    const req = { headers: { authorization: 'Basic dXNlcjpwYXNz' } };
    const res = makeRes();
    const next = jest.fn();
    authGuard(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when token is signed with wrong secret', () => {
    const token = jwt.sign({ id: 'x' }, 'wrong-secret');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = makeRes();
    const next = jest.fn();
    authGuard(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next() and attaches decoded user for valid token', () => {
    const payload = { id: 'att-1', email: 'alice@example.com', role: 'attendee' };
    const token = validToken(payload);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = makeRes();
    const next = jest.fn();
    authGuard(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({ id: 'att-1', role: 'attendee' });
  });

  test('returns 401 when token is expired', () => {
    const token = jwt.sign({ id: 'att-1' }, process.env.JWT_SECRET, { expiresIn: -1 });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = makeRes();
    const next = jest.fn();
    authGuard(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
