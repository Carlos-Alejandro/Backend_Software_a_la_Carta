const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ecommerce API - Software a la Carta',
      version: '1.0.0',
      description: 'Documentación de endpoints de autenticación',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor local',
      },
    ],
    components: {
      // ✅ Agregamos bearerAuth
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      // ✅ Mantén tus esquemas y respuestas
      schemas: require('./components/schemas'),
      responses: require('./components/responses'),
    },
    // ✅ Activamos la seguridad globalmente
    // security: [
    //   {
    //     bearerAuth: [],
    //   },
    // ],
  },
  apis: ['./src/routes/*.js'], // escanear tus rutas
};

const swaggerSpec = swaggerJsDoc(options);

const swaggerDocs = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = swaggerDocs;
