module.exports = {
  RegisterRequest: {
    type: 'object',
    required: ['name', 'email', 'password'],
    properties: {
      name: { type: 'string', example: 'Carlos Alejandro' },
      email: { type: 'string', example: 'carlos@example.com' },
      password: { type: 'string', example: '12345678' },
    },
  },

  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', example: 'carlos@example.com' },
      password: { type: 'string', example: '12345678' },
    },
  },

  AuthResponse: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Login exitoso' },
      token: { type: 'string', example: 'eyJhbGciOiJIUzI1...' },
      user: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string' },
        },
      },
    },
  },

  Product: {
    type: 'object',
    required: ['name', 'price', 'stock', 'categoryId'],
    properties: {
      name: { type: 'string', example: 'Laptop HP 14' },
      description: { type: 'string', example: 'Laptop con 8GB RAM y SSD de 512GB' },
      price: { type: 'number', example: 12999.99 },
      stock: { type: 'integer', example: 5 },
      imageUrl: { type: 'string', example: 'https://example.com/image.jpg' },
      categoryId: { type: 'string', example: '64d989bdfc13ae1739000025' },
    },
  },

  Category: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', example: 'Laptops' },
      description: { type: 'string', example: 'Portátiles, notebooks y ultrabooks' },
    },
  },

  PatchProduct: {
    type: 'object',
    properties: {
      price: { type: 'number', example: 10999.99 },
      stock: { type: 'integer', example: 10 },
    },
    description: 'Solo se pueden modificar los campos price y stock',
  },

  // ====== CARRITO ======
  AddToCartRequest: {
    type: 'object',
    required: ['productId', 'quantity'],
    properties: {
      productId: { type: 'string', example: '64d989bdfc13ae1739000025' },
      quantity: { type: 'integer', minimum: 1, example: 2 },
    },
  },

  UpdateCartItemRequest: {
    type: 'object',
    required: ['quantity'],
    properties: {
      quantity: { type: 'integer', minimum: 0, example: 3 },
    },
  },

  CartItemResponse: {
    type: 'object',
    properties: {
      product: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          price: { type: 'number' },
          imageUrl: { type: 'string' },
          categoryId: { type: 'string' },
        },
      },
      quantity: { type: 'integer' },
      subtotal: { type: 'number' },
    },
  },

  CartResponse: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/CartItemResponse' },
      },
      total: { type: 'number' },
    },
  },
  // Respuesta de éxito homogénea
  ApiSuccess: {
    type: 'object',
    required: ['success', 'statusCode', 'message'],
    properties: {
      success: { type: 'boolean', example: true },
      statusCode: { type: 'integer', example: 200 },
      message: { type: 'string', example: 'Operación exitosa' },
      // `data` puede ser objeto, array, string, etc.; lo dejamos abierto
      data: { nullable: true },
    },
  },

  // Respuesta de error homogénea (genérica, sin ejemplos fijos)
  ApiError: {
    type: 'object',
    required: ['success', 'statusCode', 'message'],
    properties: {
      success: { type: 'boolean', example: false },
      statusCode: {
        type: 'integer',
        description: 'Código HTTP del error (400, 401, 403, 404, 409, 500)',
      },
      message: {
        type: 'string',
        description: 'Mensaje de error en lenguaje natural',
      },
      // `error` puede ser:
      // - null
      // - un objeto con info extra (p.ej. { stack } en dev)
      // - un array de errores de validación (express-validator)
      error: {
        nullable: true,
        oneOf: [
          { type: 'object', additionalProperties: true },
          {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                msg: { type: 'string', example: 'quantity debe ser un entero >= 1' },
                param: { type: 'string', example: 'quantity' },
                location: { type: 'string', example: 'body' },
              },
            },
          },
          { type: 'null' },
        ],
        description: 'Detalles del error (puede ser null, objeto, o listado de validaciones)',
      },
    },
  },


  // ===== Cart mutation payloads =====
  CartTotals: {
    type: 'object',
    properties: {
      lines: { type: 'integer', example: 2 },
      items: { type: 'integer', example: 3 },
      total: { type: 'number', example: 25999.98 }
    }
  },
  CartChangedItem: {
    type: 'object',
    nullable: true,
    properties: {
      productId: { type: 'string', example: '66a1b2c3d4e5f6a7b8c9d0e1' },
      quantity: { type: 'integer', example: 2 },
      unitPrice: { type: 'number', example: 12999.99 },
      subtotal: { type: 'number', example: 25999.98 }
    }
  },
  CartMutationResponse: {
    type: 'object',
    properties: {
      cartId: { type: 'string', example: '66b0aa0aa0aa0aa0aa0aa0aa' },
      action: { type: 'string', enum: ['added','updated','removed','cleared'], example: 'added' },
      changedItem: { $ref: '#/components/schemas/CartChangedItem' },
      totals: { $ref: '#/components/schemas/CartTotals' }
    }
  },


};
