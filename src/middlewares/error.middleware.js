// src/middlewares/error.middleware.js
const logger = require('../utils/logger');
const { errorResponse } = require('../utils/response');

module.exports = (err, req, res, next) => {
  // 1) Status + mensaje base
  let status = err.statusCode || 500;
  let message = err.message || 'Error del servidor';

  // 2) Mapeos comunes
  if (err.name === 'CastError') {
    status = 400;
    message = 'Parámetro inválido';
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = 'Errores de validación en el modelo';
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `Valor duplicado para el campo "${field}"` : 'Recurso duplicado';
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Token inválido';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expirado';
  }

  // 3) Logging estructurado (con correlación)
  try {
    logger.error('http_error', {
      reqId: req.id,
      userId: req.user?.id || req.user?._id || null,
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      status,
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
      validation: err.name === 'ValidationError' ? Object.keys(err.errors || {}) : undefined,
      duplicateKey: err.code === 11000 ? err.keyValue : undefined,
    });
  } catch (_) {
    // no rompas la respuesta si el logger falla
  }

  // 4) Respuesta homogénea
  const debug =
    process.env.NODE_ENV === 'production'
      ? null
      : { name: err.name, stack: err.stack };

  return errorResponse(res, { message, statusCode: status, error: debug });
};
