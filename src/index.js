require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());

// Conectar a Mongo
connectDB();

app.get('/', (req, res) => {
  res.send('API funcionando...');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
