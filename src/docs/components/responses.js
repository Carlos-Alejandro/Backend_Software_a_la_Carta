module.exports = {
  SuccessOK: {
    description: 'Operación exitosa',
  },
  Created: {
    description: 'Recurso creado exitosamente',
  },
  NoContent: {
    description: 'Recurso eliminado exitosamente, sin contenido',
  },
  ValidationError: {
    description: 'Datos de entrada no válidos',
  },
  UnauthorizedError: {
    description: 'No autorizado. Token inválido o ausente.',
  },
  ForbiddenError: {
    description: 'Permisos insuficientes para acceder a este recurso',
  },
  NotFound: {
    description: 'Recurso no encontrado',
  },
  DuplicatedResource: {
    description: 'Recurso duplicado. El correo ya está registrado',
  },
  InternalServerError: {
    description: 'Error interno del servidor',
  },
};
