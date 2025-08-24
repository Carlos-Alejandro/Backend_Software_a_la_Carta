// src/config/security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

// ... tus helpers buildCorsOptions / corsOptionsDelegate / keyByUserOrIp ...

function configureSecurity(app) {
  app.set('trust proxy', 1);
  app.use(helmet());

  if (process.env.NODE_ENV !== 'production') {
    app.use(cors());
    // ANTES: app.options('*', cors()); // ❌ Express 5 rompe con '*'
    app.options(/.*/, cors());          // ✅ usa regex
  } else {
    app.use(cors(corsOptionsDelegate));
    // ANTES: app.options('/*', cors(corsOptionsDelegate)); // ❌
    app.options(/.*/, cors(corsOptionsDelegate));          // ✅
  }

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX || 100),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || (req.ip || '').replace(/:/g, '-'), // normaliza IPv6
  });
  // ANTES: app.use('/api/', apiLimiter);  // funciona, pero mejor sin barra final
  app.use('/api', apiLimiter);            // ✅

  const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_AUTH_MAX || 10),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || (req.ip || '').replace(/:/g, '-'),
  });
  app.use('/api/auth', authLimiter);
}

module.exports = { configureSecurity };
