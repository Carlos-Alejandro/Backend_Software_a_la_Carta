const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response');

const register = async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    if (role !== 'user' && role !== 'admin') {
      return errorResponse(res, {
        message: 'Rol inválido. Solo se permite "user" o "admin"',
        statusCode: 400,
      });
    }

    const user = await authService.registerUser(name, email, password, role);

    // Elimina campos innecesarios de la respuesta
    const sanitizedUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return successResponse(res, {
      message: 'Usuario registrado correctamente',
      data: sanitizedUser,
      statusCode: 201,
    });

  } catch (error) {
    const isDuplicate = error.message.includes('registrado');
    return errorResponse(res, {
      message: error.message,
      statusCode: isDuplicate ? 409 : 400,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { token } = await authService.loginUser(email, password);

    return successResponse(res, {
      message: 'Login exitoso',
      data: { token },
    });

  } catch (error) {
    return errorResponse(res, {
      message: error.message,
      statusCode: 401,
    });
  }
};

module.exports = {
  register,
  login,
};
