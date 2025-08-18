// src/index.js (al inicio del archivo)
require('dotenv').config();  // ✅ primero, antes de TODO

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const swaggerDocs = require('./docs/swagger');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const errorHandler = require('./middlewares/error.middleware');

// Conectar DB (ya con envs cargadas)
connectDB();

const app = express();
swaggerDocs(app);

app.use(cors({
  origin: ['http://localhost:5173'], // Vite
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📚 Swagger en http://localhost:${PORT}/api/docs`);
});
