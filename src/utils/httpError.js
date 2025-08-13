// src/utils/httpError.js
class HttpError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Helpers opcionales (por legibilidad al lanzar errores)
const httpErrors = {
  badRequest: (m = 'Solicitud inválida') => new HttpError(m, 400),
  unauthorized: (m = 'No autorizado') => new HttpError(m, 401),
  forbidden: (m = 'Prohibido') => new HttpError(m, 403),
  notFound: (m = 'No encontrado') => new HttpError(m, 404),
  conflict: (m = 'Conflicto') => new HttpError(m, 409),
  unprocessable: (m = 'Entidad no procesable') => new HttpError(m, 422),
};

module.exports = { HttpError, httpErrors };
