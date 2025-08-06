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
};
