// src/utils/response.js
const omitMeta = require('./omitMeta');

/**
 * Envía una respuesta exitosa
 * Limpia metacampos (__v, createdAt, updatedAt) de data.
 * extraKeys permite ocultar llaves adicionales si algún día lo necesitas.
 */
const sendSuccess = (res, { message = 'Éxito', data = {}, statusCode = 200, extraKeys = [] } = {}) => {
  const cleaned = omitMeta(data, extraKeys);
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data: cleaned,
  });
};

/**
 * Envía una respuesta de error
 */
const sendError = (res, { message = 'Error del servidor', statusCode = 500, error = null } = {}) => {
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    error,
  });
};

module.exports = {
  successResponse: sendSuccess,
  errorResponse: sendError,
};
