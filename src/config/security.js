// src/config/security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

function buildCorsOptions() {
  const whitelist = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const isSameOrigin = (req, origin) => {
    if (!origin) return true; // curl/Postman o same-origin sin cabecera
    try {
      const u = new URL(origin);
      const host = req.headers.host; // p.ej. "localhost:3000"
      const [hName, hPort = req.secure ? '443' : '80'] = host.split(':');
      const oPort = u.port || (u.protocol === 'https:' ? '443' : '80');
      return `${u.hostname}:${oPort}` === `${hName}:${hPort}`;
    } catch {
      return false;
    }
  };

  return {
    credentials: true,
    methods: ['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
    origin: (origin, cb) => {
      // 1) Same-origin → permitir
      if (isSameOrigin(this?.req ?? {}, origin)) return cb(null, true);
      // 2) Whitelist explícita
      if (whitelist.includes(origin)) return cb(null, true);
      // 3) Dev: localhost/127.* (útil mientras desarrollas)
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
      // 4) Bloquear
      return cb(new Error('Not allowed by CORS'));
    },
    optionsSuccessStatus: 204,
  };
}

function configureSecurity(app) {
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors(buildCorsOptions()));
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX || 100),
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', apiLimiter);

  const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_AUTH_MAX || 10),
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/auth/', authLimiter);
}

module.exports = { configureSecurity };
