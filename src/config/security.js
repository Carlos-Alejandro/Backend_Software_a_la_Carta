// src/config/security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

/* ---------- Helpers ---------- */
function getWhitelist() {
  return (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function isSameOrigin(req) {
  const origin = req.header('Origin');
  if (!origin) return true; // curl/Postman/same-origin sin header
  try {
    const u = new URL(origin);
    const host = req.headers.host || ''; // ej: "localhost:3000"
    const [hName, hPort] = host.split(':');
    const reqPort = hPort || (req.secure ? '443' : '80');
    const oPort = u.port || (u.protocol === 'https:' ? '443' : '80');
    return u.hostname === hName && oPort === reqPort;
  } catch {
    return false;
  }
}

/** Delegate CORS: aquí SÍ tenemos req */
function corsOptionsDelegate(req, cb) {
  const origin = req.header('Origin');
  const whitelist = getWhitelist();

  let allow = false;
  if (!origin) {
    allow = true; // CLI/same-origin
  } else if (isSameOrigin(req)) {
    allow = true; // mismo host:puerto
  } else if (whitelist.includes(origin)) {
    allow = true; // explícito en .env
  } else if (
    (process.env.ALLOW_LOCALHOST === 'true') &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
  ) {
    allow = true; // depuración local en prod (opcional)
  }

  cb(null, {
    origin: allow,
    credentials: true,
    methods: ['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization','X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    optionsSuccessStatus: 204,
  });
}

/** Rate-limit key: por usuario si existe, si no por IP (normalizando IPv6) */
function keyByUserOrIp(req) {
  if (req.user?.id) return `u-${req.user.id}`;
  return `ip-${(req.ip || '').replace(/:/g, '-')}`; // ::1 => --1
}

/* ---------- Config principal ---------- */
function configureSecurity(app) {
  app.set('trust proxy', 1);
  app.use(helmet());

  if (process.env.NODE_ENV !== 'production') {
    // Dev: permisivo para no pelear con Swagger/local
    app.use(cors());
    // Express 5: usa regex en vez de '*'
    app.options(/.*/, cors());
  } else {
    // Prod: whitelist / same-origin vía delegate
    app.use((req, res, next) => cors(corsOptionsDelegate)(req, res, next));
    app.options(/.*/, (req, res, next) => cors(corsOptionsDelegate)(req, res, next));
  }

  // Limite general /api
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX || 100),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyByUserOrIp,
  });
  app.use('/api', apiLimiter);

  // Limite estricto /api/auth
  const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_AUTH_MAX || 10),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyByUserOrIp,
  });
  app.use('/api/auth', authLimiter);
}

module.exports = { configureSecurity };
