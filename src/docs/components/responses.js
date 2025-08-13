// src/docs/components/responses.js
module.exports = {
  SuccessOK: {
    description: 'Operación exitosa',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiSuccess' },
        examples: {
          ok: {
            summary: 'Respuesta estándar',
            value: {
              success: true,
              statusCode: 200,
              message: 'Operación exitosa',
              data: {},
            },
          },
        },
      },
    },
  },

  Created: {
    description: 'Recurso creado exitosamente',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiSuccess' },
        examples: {
          created: {
            summary: 'Creación correcta',
            value: {
              success: true,
              statusCode: 201,
              message: 'Recurso creado',
              data: {},
            },
          },
        },
      },
    },
  },

  ValidationError: {
    description: 'Datos de entrada no válidos',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiError' },
        examples: {
          validation: {
            summary: 'Campos inválidos (express-validator)',
            value: {
              success: false,
              statusCode: 400,
              message: 'Datos de entrada no válidos',
              error: [
                { msg: 'quantity debe ser un entero >= 1', param: 'quantity', location: 'body' },
              ],
            },
          },
          badParam: {
            summary: 'Parámetro de ruta inválido (CastError)',
            value: {
              success: false,
              statusCode: 400,
              message: 'Parámetro inválido',
              error: null,
            },
          },
        },
      },
    },
  },

  UnauthorizedError: {
    description: 'No autorizado. Token inválido o ausente.',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiError' },
        examples: {
          noToken: {
            summary: 'Token ausente',
            value: {
              success: false,
              statusCode: 401,
              message: 'Token no proporcionado',
              error: null,
            },
          },
          badToken: {
            summary: 'Token inválido/expirado',
            value: {
              success: false,
              statusCode: 401,
              message: 'Token inválido',
              error: null,
            },
          },
        },
      },
    },
  },

  ForbiddenError: {
    description: 'Permisos insuficientes para acceder a este recurso',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiError' },
        examples: {
          forbidden: {
            summary: 'Usuario sin permisos (no admin)',
            value: {
              success: false,
              statusCode: 403,
              message: 'Permisos insuficientes para acceder a este recurso',
              error: null,
            },
          },
        },
      },
    },
  },

  NotFound: {
    description: 'Recurso no encontrado',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiError' },
        examples: {
          notFound: {
            summary: 'ID válido, pero el recurso no existe',
            value: {
              success: false,
              statusCode: 404,
              message: 'Recurso no encontrado',
              error: null,
            },
          },
        },
      },
    },
  },

  ConflictError: {
    description: 'Conflicto de negocio (p. ej., duplicado o stock insuficiente)',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiError' },
        examples: {
          duplicate: {
            summary: 'Campo único duplicado (Mongo 11000)',
            value: {
              success: false,
              statusCode: 409,
              message: 'Valor duplicado para el campo "name"',
              error: null,
            },
          },
          stock: {
            summary: 'Stock insuficiente',
            value: {
              success: false,
              statusCode: 409,
              message: 'Stock insuficiente. Disponibles: 3. Solicitados: 10',
              error: null,
            },
          },
        },
      },
    },
  },

  InternalServerError: {
    description: 'Error interno del servidor',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiError' },
        examples: {
          server: {
            summary: 'Fallo inesperado',
            value: {
              success: false,
              statusCode: 500,
              message: 'Error del servidor',
              error: null,
            },
          },
        },
      },
    },
  },
};
