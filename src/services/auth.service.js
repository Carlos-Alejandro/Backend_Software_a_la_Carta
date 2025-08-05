const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerUser = async (name, email, password) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error('El correo ya está registrado');

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ name, email, passwordHash: hashedPassword });
  await user.save();

  return user;
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Credenciales inválidas');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new Error('Credenciales inválidas');

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return { token, user };
};

module.exports = {
  registerUser,
  loginUser,
};
