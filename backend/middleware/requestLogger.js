/**
 * requestLogger middleware
 * Logs every incoming request in the format: [METHOD] [PATH] [TIMESTAMP]
 * Applied globally — runs for both public and protected requests.
 * Does NOT log Authorization headers or sensitive request bodies.
 * Requirements: 4.2
 */
function requestLogger(req, res, next) {
  const method = req.method;
  const path = req.originalUrl || req.url;
  const timestamp = new Date().toISOString();
  // Intentionally omit headers / body to avoid logging credentials
  console.log(`[${method}] ${path} ${timestamp}`);
  next();
}

module.exports = requestLogger;
