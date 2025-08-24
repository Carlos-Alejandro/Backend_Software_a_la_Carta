// src/controllers/user.controller.js
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const asyncHandler = require('../middlewares/asyncHandler');
const { successResponse } = require('../utils/response');
const { HttpError } = require('../utils/httpError');

/** Devuelve un objeto seguro para exponer por API */
function sanitizeUser(user) {
  if (!user) return null;
  const u = user.toObject ? user.toObject() : user;
  return {
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
  };
}

/**
 * GET /api/users/me
 * Perfil del usuario autenticado
 */
const getMe = asyncHandler(async (req, res, next) => {
  const me = await User.findById(req.user.id).lean();
  if (!me) return next(new HttpError('Usuario no encontrado', 404));
  return successResponse(res, {
    message: 'Perfil obtenido',
    data: sanitizeUser(me),
  });
});

/**
 * PUT /api/users/me
 * Actualiza nombre y/o email del usuario autenticado
 */
const updateMe = asyncHandler(async (req, res, next) => {
  const { name, email } = req.body;
  const updates = {};

  if (typeof name === 'string' && name.trim()) updates.name = name.trim();

  if (typeof email === 'string' && email.trim()) {
    const lower = email.trim().toLowerCase();
    const exists = await User.findOne({ email: lower, _id: { $ne: req.user.id } }).lean();
    if (exists) return next(new HttpError('El correo ya está en uso', 409));
    updates.email = lower;
  }

  if (Object.keys(updates).length === 0) {
    return successResponse(res, { message: 'Sin cambios', data: {} });
  }

  const updated = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!updated) return next(new HttpError('Usuario no encontrado', 404));

  return successResponse(res, {
    message: 'Perfil actualizado',
    data: sanitizeUser(updated),
  });
});

/**
 * PUT /api/users/me/password
 * Cambia la contraseña del usuario autenticado
 * Body: { currentPassword, newPassword }
 */
const changeMyPassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new HttpError('currentPassword y newPassword son requeridos', 400));
  }
  if (String(newPassword).length < 8) {
    return next(new HttpError('La nueva contraseña debe tener al menos 8 caracteres', 400));
  }

  const user = await User.findById(req.user.id);
  if (!user) return next(new HttpError('Usuario no encontrado', 404));

  const ok = await user.comparePassword(currentPassword);
  if (!ok) return next(new HttpError('La contraseña actual no es correcta', 401)); // 401 coherente con auth

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  return successResponse(res, { message: 'Contraseña actualizada' });
});

/* =========================
 *   ENDPOINTS SOLO ADMIN
 * ========================= */

/**
 * GET /api/users
 * Lista paginada de usuarios (filtros opcionales ?q=&role=&page=&limit=)
 */
const listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, q = '', role } = req.query;

  const p = Math.max(1, parseInt(page, 10));
  const l = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const filter = {};
  if (q) {
    filter.$or = [
      { name: { $regex: String(q), $options: 'i' } },
      { email: { $regex: String(q), $options: 'i' } },
    ];
  }
  if (role && ['user', 'admin'].includes(role)) filter.role = role;

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l).lean(),
    User.countDocuments(filter),
  ]);

  return successResponse(res, {
    message: 'Usuarios obtenidos',
    data: {
      total,
      page: p,
      pageSize: l,
      items: items.map(sanitizeUser),
    },
  });
});

/**
 * GET /api/users/:id
 * Detalle de un usuario
 */
const getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).lean();
  if (!user) return next(new HttpError('Usuario no encontrado', 404));
  return successResponse(res, { message: 'Usuario encontrado', data: sanitizeUser(user) });
});

/**
 * PUT /api/users/:id
 * Actualiza nombre, email y/o role (user|admin)
 */
const updateUserById = asyncHandler(async (req, res, next) => {
  const { name, email, role } = req.body;
  const updates = {};

  if (typeof name === 'string' && name.trim()) updates.name = name.trim();

  if (typeof email === 'string' && email.trim()) {
    const lower = email.trim().toLowerCase();
    const exists = await User.findOne({ email: lower, _id: { $ne: req.params.id } }).lean();
    if (exists) return next(new HttpError('El correo ya está en uso', 409));
    updates.email = lower;
  }

  if (typeof role === 'string') {
    if (!['user', 'admin'].includes(role)) return next(new HttpError('Rol inválido', 400));
    updates.role = role;
  }

  const updated = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!updated) return next(new HttpError('Usuario no encontrado', 404));

  return successResponse(res, {
    message: 'Usuario actualizado',
    data: sanitizeUser(updated),
  });
});

/**
 * DELETE /api/users/:id
 * Elimina un usuario
 */
const deleteUserById = asyncHandler(async (req, res, next) => {
  const deleted = await User.findByIdAndDelete(req.params.id);
  if (!deleted) return next(new HttpError('Usuario no encontrado', 404));
  return successResponse(res, {
    message: 'Usuario eliminado',
    data: { _id: req.params.id },
  });
});

module.exports = {
  // usuario autenticado
  getMe,
  updateMe,
  changeMyPassword,
  // administración
  listUsers,
  getUserById,
  updateUserById,
  deleteUserById,
};
