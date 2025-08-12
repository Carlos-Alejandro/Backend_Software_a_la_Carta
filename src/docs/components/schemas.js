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

};
