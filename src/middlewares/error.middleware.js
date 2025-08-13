// src/middlewares/error.middleware.js
const { errorResponse } = require('../utils/response');
// const logger = require('../utils/logger'); // cuando lo implementes

module.exports = (err, req, res, next) => {
  // 1) Status por defecto o de HttpError
  let status = err.statusCode || 500;
  let message = err.message || 'Error del servidor';

  // 2) Mapeos comunes

  // ID inválido / cast de Mongoose (ObjectId mal formado, etc.)
  if (err.name === 'CastError') {
    status = 400;
    message = 'Parámetro inválido';
  }

  // Validación de schema (Mongoose)
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Errores de validación en el modelo';
  }

  // Clave única duplicada (Mongo/Mongoose)
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field
      ? `Valor duplicado para el campo "${field}"`
      : 'Recurso duplicado';
  }

  // JWT
  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Token inválido';
  }
  if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expirado';
  }

  // 3) Logging (cuando tengas logger)
  // logger.error({ err, status, path: req.originalUrl, user: req.user?.id });

  // 4) Respuesta homogénea
  const debug = process.env.NODE_ENV === 'development' ? { stack: err.stack } : null;
  return errorResponse(res, { message, statusCode: status, error: debug });
};
