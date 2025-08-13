module.exports = {
  SuccessOK: {
    description: 'Operación exitosa',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiSuccess' },
      },
    },
  },
  Created: {
    description: 'Recurso creado exitosamente',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiSuccess' },
      },
    },
  },
  ValidationError: {
    description: 'Datos de entrada no válidos',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiError' },
      },
    },
  },
  ConflictError: {
    description: 'Conflicto de negocio (p. ej. stock insuficiente)',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
  },

  UnauthorizedError: {
    description: 'No autorizado. Token inválido o ausente.',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
  },
  ForbiddenError: {
    description: 'Permisos insuficientes para acceder a este recurso',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
  },
  NotFound: {
    description: 'Recurso no encontrado',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
  },
  DuplicatedResource: {
    description: 'Recurso duplicado',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
  },
  InternalServerError: {
    description: 'Error interno del servidor',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
  },
};
