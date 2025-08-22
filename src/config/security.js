// src/config/security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

function buildCorsOptions() {
  const whitelist = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  return {
    origin: (origin, cb) => {
      // Permite tools como cURL / Postman (sin origin)
      if (!origin) return cb(null, true);
      if (whitelist.includes(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  };
}

function configureSecurity(app) {
  // Si estás detrás de proxy (NGINX/Cloudflare) para que rateLimit tome IP real
  app.set('trust proxy', 1);

  // Headers de seguridad
  app.use(helmet());

  // CORS con whitelist por ENV
  app.use(cors(buildCorsOptions()));

  // Rate limit general para toda la API
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: Number(process.env.RATE_LIMIT_MAX || 100), // requests por ventana
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', apiLimiter);

  // Rate limit más estricto para auth/login
  const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 min
    max: Number(process.env.RATE_LIMIT_AUTH_MAX || 10),
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/auth/', authLimiter);
}

module.exports = { configureSecurity };
