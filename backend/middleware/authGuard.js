const jwt = require('jsonwebtoken');

/**
 * authGuard middleware
 * Reads the Bearer token from the Authorization header, verifies it using
 * JWT_SECRET env variable (never hardcoded), and attaches decoded identity
 * to req.user.
 *
 * Returns HTTP 401 { error: "Unauthorized" } for missing or invalid tokens.
 * Apply only to protected endpoints; public routes bypass this middleware.
 * Requirements: 4.3
 */
function authGuard(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      // JWT_SECRET must be configured via environment variable
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, secret);
    req.user = decoded; // { id, email, role }
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = authGuard;
