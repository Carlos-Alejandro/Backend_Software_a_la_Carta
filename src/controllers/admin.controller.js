// src/controllers/admin.controller.js
const asyncHandler = require('../middlewares/asyncHandler');
const { successResponse } = require('../utils/response');
const { HttpError } = require('../utils/httpError');
const adminService = require('../services/admin.service');
const audit = require('../services/audit.service');
const User = require('../models/user.model');
const Order = require('../models/order.model');
const logger = require('../utils/logger');

/**
 * GET /api/admin/users
 */
const listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, q = '', role } = req.query;
  const data = await adminService.listUsers({ page, limit, q, role });
  return successResponse(res, { message: 'Usuarios obtenidos', data });
});

/**
 * PATCH /api/admin/users/:id/role
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; // 'user' | 'admin'

  // Capturamos el estado previo (solo lo necesario)
  const beforeUser = await User.findById(id).select('_id role').lean();

  const updated = await adminService.updateUserRole(id, role);
  if (!updated) throw new HttpError('Usuario no encontrado', 404);

  // Auditoría
  await audit.logAdminAction({
    action: 'user.role.changed',
    resource: 'user',
    actorId: req.user?._id || req.user?.id,
    targetId: updated._id,
    before: { role: beforeUser?.role ?? null },
    after: { role: updated.role },
    ip: req.ip,
    userAgent: req.get('user-agent'),
    reqId: req.id,
  });

  logger.info('admin.user.role.changed', {
    reqId: req.id,
    actorId: req.user?._id || req.user?.id,
    targetId: updated._id,
    role: updated.role,
  });

  return successResponse(res, { message: 'Rol actualizado', data: updated });
});

/**
 * GET /api/admin/orders
 */
const listOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, from, to, userId } = req.query;
  const data = await adminService.listOrders({ page, limit, status, from, to, userId });
  return successResponse(res, { message: 'Órdenes obtenidas', data });
});

/**
 * GET /api/admin/orders/:id
 */
const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await adminService.getOrderById(id);
  if (!order) throw new HttpError('Orden no encontrada', 404);
  return successResponse(res, { message: 'Orden obtenida', data: order });
});

/**
 * PATCH /api/admin/orders/:id/status
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // enum del esquema

  // Estado previo
  const beforeOrder = await Order.findById(id).select('_id status').lean();

  const updated = await adminService.updateOrderStatus(id, status);
  if (!updated) throw new HttpError('Orden no encontrada o transición inválida', 400);

  // Auditoría
  await audit.logAdminAction({
    action: 'order.status.changed',
    resource: 'order',
    actorId: req.user?._id || req.user?.id,
    targetId: updated._id,
    before: { status: beforeOrder?.status ?? null },
    after: { status: updated.status },
    ip: req.ip,
    userAgent: req.get('user-agent'),
    reqId: req.id,
  });

  logger.info('admin.order.status.changed', {
    reqId: req.id,
    actorId: req.user?._id || req.user?.id,
    orderId: updated._id,
    from: beforeOrder?.status ?? null,
    to: updated.status,
  });

  return successResponse(res, { message: 'Estado de orden actualizado', data: updated });
});

/**
 * GET /api/admin/reports/top-products
 */
const reportTopProducts = asyncHandler(async (req, res) => {
  const { from, to, limit = 10 } = req.query;
  const data = await adminService.reportTopProducts({ from, to, limit: Number(limit) });
  return successResponse(res, { message: 'Reporte generado', data });
});

module.exports = {
  listUsers,
  updateUserRole,
  listOrders,
  getOrderById,
  updateOrderStatus,
  reportTopProducts,
};
