// src/index.js
require('dotenv').config(); // ✅ siempre primero

const express = require('express');
const connectDB = require('./config/db');

// Rutas
const authRoutes = require('./routes/auth.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const webhookRoutes = require('./routes/webhook.routes'); // ⚠️ esta ruta usa express.raw en el archivo de rutas
const adminRoutes = require('./routes/admin.routes');
const userRoutes = require('./routes/user.routes');

// Docs / seguridad / middlewares
const swaggerDocs = require('./docs/swagger');
const { configureSecurity } = require('./config/security');
const errorHandler = require('./middlewares/error.middleware');
const requestId = require('./middlewares/logging/requestId.middleware');
const requestLogger = require('./middlewares/logging/requestLogger.middleware');

// Conectar DB
connectDB();

// App
const app = express();

// Seguridad global (helmet, CORS delegate, rate-limits)
configureSecurity(app);

/**
 * Webhooks (Stripe)
 * IMPORTANTE: el archivo ./routes/webhook.routes DEBE definir el endpoint con express.raw({ type: 'application/json' })
 * ej:
 *   router.post('/stripe', express.raw({ type: 'application/json' }), controller.stripeWebhook)
 * Al montar aquí ANTES de express.json(), evitamos que el raw body se consuma.
 */
app.use('/api/webhooks', webhookRoutes);

// --- Middlewares de app en orden ---
// 1) ID de correlación por request (añade req.id y header X-Request-Id)
app.use(requestId());

// 2) Body parser (después del webhook)
app.use(express.json({ limit: '1mb' }));

// 3) Logger de accesos (necesita req.body ya parseado para redactar)
app.use(requestLogger());

// Swagger: solo en dev o si lo habilitas por ENV
if (process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true') {
  swaggerDocs(app);
}

// Rutas de negocio
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// Error handler al final SIEMPRE
app.use(errorHandler);

// Arranque
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true') {
    console.log(`📚 Swagger en http://localhost:${PORT}/api/docs`);
  } else {
    console.log('📚 Swagger deshabilitado en producción');
  }
});
