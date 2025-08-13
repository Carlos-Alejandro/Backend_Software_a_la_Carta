const { errorResponse } = require('../utils/response');
const { HttpError } = require('../utils/httpError');
// const logger = require('../utils/logger'); // cuando lo implementes

module.exports = (err, req, res, next) => {
  // 1) Status por defecto o de HttpError
  let status = err.statusCode || 500;
  let message = err.message || 'Error del servidor';

  // 2) Mapeos comunes
  // Mongoose: validación de schema
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Errores de validación en el modelo';
  }

  // Mongoose/Mongo: clave duplicada
  // err.code === 11000 => duplicado (p.ej. email único)
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field
      ? `Valor duplicado para el campo "${field}"`
      : 'Recurso duplicado';
  }

  // JWT errors (si en algún middleware usas jsonwebtoken y tiras estos)
  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Token inválido';
  }
  if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expirado';
  }

  // 3) Logging (amplíalo cuando tengas logger)
  // logger.error({ err, status, path: req.originalUrl, user: req.user?.id });

  // 4) Respuesta homogénea
  const debug = process.env.NODE_ENV === 'development' ? { stack: err.stack } : null;
  return errorResponse(res, { message, statusCode: status, error: debug });
};
