// src/docs/swagger.js
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ecommerce API - Software a la Carta',
      version: '1.0.0',
      description: 'Documentación de endpoints (Auth, Productos, Carrito, Órdenes y Pagos)',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Servidor local' },
      // { url: 'https://tu-dominio.com', description: 'Producción' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      // Importa tus módulos
      schemas: require('./components/schemas'),
      responses: require('./components/responses'),
    },
    // ✅ Seguridad GLOBAL activada
    // security: [{ bearerAuth: [] }],
  },
  // Escanea todas tus rutas (subcarpetas incluidas)
  apis: ['src/routes/**/*.js'],
};

const swaggerSpec = swaggerJsDoc(options);

function swaggerDocs(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = swaggerDocs;
