// src/controllers/admin.controller.js
const asyncHandler = require('../middlewares/asyncHandler');
const { successResponse } = require('../utils/response');
const { HttpError } = require('../utils/httpError');
const adminService = require('../services/admin.service');

const listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, q = '', role } = req.query;
  const data = await adminService.listUsers({ page, limit, q, role });
  return successResponse(res, { message: 'Usuarios obtenidos', data });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; // 'user' | 'admin'
  const updated = await adminService.updateUserRole(id, role);
  if (!updated) throw new HttpError('Usuario no encontrado', 404);
  return successResponse(res, { message: 'Rol actualizado', data: updated });
});

const listOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, from, to, userId } = req.query;
  const data = await adminService.listOrders({ page, limit, status, from, to, userId });
  return successResponse(res, { message: 'Órdenes obtenidas', data });
});

const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await adminService.getOrderById(id);
  if (!order) throw new HttpError('Orden no encontrada', 404);
  return successResponse(res, { message: 'Orden obtenida', data: order });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // must be one of schema enum
  const updated = await adminService.updateOrderStatus(id, status);
  if (!updated) throw new HttpError('Orden no encontrada o transición inválida', 400);
  return successResponse(res, { message: 'Estado de orden actualizado', data: updated });
});

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
