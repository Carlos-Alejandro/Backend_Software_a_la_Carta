// src/middlewares/requestLogger.middleware.js
const logger = require('../../utils/logger');

const SENSITIVE_HEADERS = new Set(['authorization', 'cookie', 'x-api-key']);
const SENSITIVE_KEYS = new Set(['password', 'passwordHash', 'token', 'client_secret', 'card', 'cvv', 'cvc']);

function redactObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(k)) out[k] = '***';
    else if (v && typeof v === 'object') out[k] = redactObject(v);
    else out[k] = v;
  }
  return out;
}

module.exports = function requestLogger() {
  return (req, res, next) => {
    // Opcional: silenciar spam de Swagger/assets
    if (/^\/api\/docs/.test(req.originalUrl)) return next();

    const start = process.hrtime.bigint();
    const { method, originalUrl } = req;

    // Redacta headers
    const headers = {};
    for (const [k, v] of Object.entries(req.headers || {})) {
      headers[k] = SENSITIVE_HEADERS.has(k.toLowerCase()) ? '***' : v;
    }

    // No intentes loguear body de multipart (archivos)
    const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data');
    const safeBody = isMultipart ? '[multipart]' : redactObject(req.body);

    res.on('finish', () => {
      const durationMs = Number((process.hrtime.bigint() - start) / BigInt(1e6));
      const meta = {
        reqId: req.id,
        userId: req.user?.id || req.user?._id || null,
        ip: req.ip,
        ua: req.get('user-agent'),
        method,
        path: originalUrl,
        status: res.statusCode,
        length: res.getHeader('content-length') || null,
        durationMs,
        headers,
        body: safeBody,
      };
      logger.info('http_request', meta);
    });

    next();
  };
};
