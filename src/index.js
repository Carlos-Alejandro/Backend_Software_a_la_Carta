const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // ✅ buena práctica
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const swaggerDocs = require('./docs/swagger'); // Importa la configuración de Swagger
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');

dotenv.config(); // ✅ primero cargamos variables de entorno
connectDB();     // ✅ conectamos a Mongo

const app = express();

// Swagger Docs
swaggerDocs(app); // ✅ habilita la documentación de Swagger


app.use(cors());           // ✅ habilita CORS (útil para frontend)
app.use(express.json());   // ✅ para recibir JSON

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📚 Documentación Swagger disponible en http://localhost:${PORT}/api/docs`);
});
