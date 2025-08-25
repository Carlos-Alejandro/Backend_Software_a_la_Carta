// src/middlewares/logging/requestLogger.middleware.js
const logger = require('../../utils/logger');

const SENSITIVE_HEADERS = new Set([
  'authorization', 'cookie', 'x-api-key', 'stripe-signature'
]);

const SENSITIVE_KEYS = new Set([
  'password', 'passwordHash', 'token', 'client_secret', 'card', 'cvv', 'cvc'
]);

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

/**
 * Sanitiza la URL para no loguear tokens en querystring
 * Oculta: token, code, access_token, id_token
 */
function sanitizeUrl(req, url) {
  try {
    const u = new URL(url, `http://${req.headers.host || 'localhost'}`);
    for (const k of ['token', 'code', 'access_token', 'id_token']) {
      if (u.searchParams.has(k)) u.searchParams.set(k, '***');
    }
    const qs = u.searchParams.toString();
    return qs ? `${u.pathname}?${qs}` : u.pathname;
  } catch {
    return url; // si falla el parseo, regresa tal cual
  }
}

module.exports = function requestLogger() {
  return (req, res, next) => {
    // Evita ruido de la UI de Swagger (pero sí loguea lo que llames desde ahí)
    if (/^\/api\/docs/.test(req.originalUrl)) return next();

    const start = process.hrtime.bigint();
    const { method, originalUrl } = req;

    // Redacta headers sensibles
    const headers = {};
    for (const [k, v] of Object.entries(req.headers || {})) {
      headers[k] = SENSITIVE_HEADERS.has(k.toLowerCase()) ? '***' : v;
    }

    // Evita loguear cuerpos de multipart (subida de archivos)
    const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data');
    const safeBody = isMultipart ? '[multipart]' : redactObject(req.body);

    res.on('finish', () => {
      const durationMs = Number((process.hrtime.bigint() - start) / BigInt(1e6));
      const safePath = sanitizeUrl(req, originalUrl);

      const meta = {
        reqId: req.id,
        userId: req.user?.id || req.user?._id || null,
        ip: req.ip,
        ua: req.get('user-agent'),
        method,
        path: safePath, // <-- ya sanitizada
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
