// utils/response.js

/**
 * Envía una respuesta exitosa
 */
const sendSuccess = (res, { message = 'Éxito', data = {}, statusCode = 200 }) => {
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data,
  });
};

/**
 * Envía una respuesta de error
 */
const sendError = (res, { message = 'Error del servidor', statusCode = 500, error = null }) => {
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
