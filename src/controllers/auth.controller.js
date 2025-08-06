const authService = require('../services/auth.service');

const register = async (req, res) => {
  try {
    // ✅ Aceptamos 'role', y si no lo mandan, se asigna 'user' por defecto
    const { name, email, password, role = 'user' } = req.body;

    // 🔐 Validación para evitar roles no válidos
    if (role !== 'user' && role !== 'admin') {
      return res.status(400).json({ message: 'Rol inválido. Solo se permite "user" o "admin"' });
    }

    const user = await authService.registerUser(name, email, password, role);
    res.status(201).json({ message: 'Usuario registrado correctamente', user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.loginUser(email, password);
    res.json({ message: 'Login exitoso', token, user });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
};
