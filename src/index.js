// src/index.js
require('dotenv').config(); // ✅ antes de TODO

const express = require('express');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const webhookRoutes = require('./routes/webhook.routes'); // Ruta para Stripe
const adminRoutes = require('./routes/admin.routes'); // Ruta para admin
const userRoutes = require('./routes/user.routes'); // Ruta para usuarios (perfil, pedidos propios, etc)



const swaggerDocs = require('./docs/swagger'); // wrapper de swagger
const { configureSecurity } = require('./config/security');
const errorHandler = require('./middlewares/error.middleware');

// Conectar DB (ya con envs)
connectDB();

// Inicializar app
const app = express();

// Seguridad (helmet, CORS por whitelist, rate limits)
configureSecurity(app);

// Webhooks (Stripe) 
app.use('/api/webhooks', webhookRoutes);

// Body parser (ajusta límite si subes archivos)
app.use(express.json({ limit: '1mb' }));

// Swagger: solo en dev o cuando lo habilites por ENV
if (process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true') {
  swaggerDocs(app);
}

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes); 
app.use('/api/admin', adminRoutes); // Rutas admin (protegidas y solo admin)
app.use('/api/users', userRoutes); // Rutas de usuarios

// Error handler al final
app.use(errorHandler);

// Inicializar servidor 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true') {
    console.log(`📚 Swagger en http://localhost:${PORT}/api/docs`);
  } else {
    console.log('📚 Swagger deshabilitado en producción');
  }
});
