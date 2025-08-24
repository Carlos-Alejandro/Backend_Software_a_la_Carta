// src/routes/admin.routes.js
const express = require('express');
const { param } = require('express-validator');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const auth = require('../middlewares/auth.middleware');
const isAdmin = require('../middlewares/isAdmin.middleware');
const validate = require('../middlewares/validate.middleware');
const adminController = require('../controllers/admin.controller');

const {
  listUsersValidator,
  updateUserRoleValidator,
  listOrdersValidator,
  updateOrderStatusValidator,
  topProductsValidator,
} = require('../middlewares/validators/admin.validator');

// --- Hardening para el área de administración ---

// Rate limit dedicado al panel admin (ajusta a tus necesidades)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,                  // 300 req/ventana para admin
  standardHeaders: true,
  legacyHeaders: false,
});

// Evitar cacheo intermedio/proxy
function noStore(req, res, next) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
}

// Protegemos TODO el router
router.use(auth, isAdmin, adminLimiter, noStore);

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Endpoints exclusivos para administradores (requieren bearer token de admin)
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Listar usuarios con paginación y búsqueda
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *         description: Tamaño de página
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Búsqueda por nombre o email (case-insensitive)
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [user, admin] }
 *         description: Filtrar por rol
 *     responses:
 *       200:
 *         description: Lista paginada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado (se requiere rol admin)
 */
router.get('/users', listUsersValidator, validate, adminController.listUsers);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   patch:
 *     summary: Cambiar rol de un usuario (user/admin)
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 example: admin
 *     responses:
 *       200:
 *         description: Rol actualizado
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Usuario no encontrado
 */
router.patch('/users/:id/role', updateUserRoleValidator, validate, adminController.updateUserRole);

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Listar órdenes con filtros (status, rango de fecha, usuario)
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, requires_payment, paid, failed, canceled]
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *         description: Fecha/hora ISO 8601 (>=)
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *         description: Fecha/hora ISO 8601 (<=)
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *         description: MongoID del usuario
 *     responses:
 *       200:
 *         description: Lista paginada de órdenes (con datos básicos de usuario)
 *       400:
 *         description: Parámetros inválidos
 */
router.get('/orders', listOrdersValidator, validate, adminController.listOrders);

/**
 * @swagger
 * /api/admin/orders/{id}:
 *   get:
 *     summary: Obtener detalle de una orden (incluye items y usuario)
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoID de la orden
 *     responses:
 *       200:
 *         description: Orden encontrada
 *       404:
 *         description: Orden no encontrada
 */
router.get(
  '/orders/:id',
  // Validación mínima inline para no romper el patrón de tu validador global
  param('id').isMongoId().withMessage('id debe ser un MongoID válido'),
  validate,
  adminController.getOrderById
);

/**
 * @swagger
 * /api/admin/orders/{id}/status:
 *   patch:
 *     summary: Actualizar estado de una orden (limitado a los estados definidos)
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoID de la orden
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, requires_payment, paid, failed, canceled]
 *                 example: canceled
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       400:
 *         description: Transición inválida o datos inválidos
 *       404:
 *         description: Orden no encontrada
 */
router.patch('/orders/:id/status', updateOrderStatusValidator, validate, adminController.updateOrderStatus);

/**
 * @swagger
 * /api/admin/reports/top-products:
 *   get:
 *     summary: Top productos por unidades y revenue (MXN)
 *     tags: [Admin]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *         description: Fecha/hora ISO 8601 (>=)
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *         description: Fecha/hora ISO 8601 (<=)
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 10 }
 *         description: Límite de resultados
 *     responses:
 *       200:
 *         description: Ranking de productos
 */
router.get('/reports/top-products', topProductsValidator, validate, adminController.reportTopProducts);

module.exports = router;
