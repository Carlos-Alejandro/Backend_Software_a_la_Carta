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

// Rate limit general del panel admin
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,                  // 300 req por ventana
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
});

// Rate limit más estricto para acciones sensibles (p.ej. cambiar estado)
const sensitiveLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 min
  max: 30,                 // 30 req por ventana
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
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
 * components:
 *   securitySchemes:        # (solo si no lo tienes en otro archivo)
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     OrderStatus:
 *       type: string
 *       description: |
 *         Estados permitidos:
 *         - **pending** — Orden creada, pendiente de flujo.
 *         - **requires_payment** — Lista para pago / requiere pago.
 *         - **paid** — Pagada (normalmente vía Stripe/confirm).
 *         - **failed** — Pago fallido.
 *         - **canceled** — Cancelada antes de pagarse.
 *       enum: [pending, requires_payment, paid, failed, canceled]
 *
 *     UpdateOrderStatus:
 *       type: object
 *       required: [status]
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/OrderStatus'
 *
 *     AdminUser:
 *       type: object
 *       properties:
 *         _id: { type: string, example: "6894c32d44f47d70918f74e3" }
 *         name: { type: string, example: "Andrea Ruiz" }
 *         email: { type: string, example: "andrea@example.com" }
 *         role: { type: string, enum: [user, admin], example: "admin" }
 *
 *     PaginatedUsers:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/AdminUser' }
 *         page: { type: integer, example: 1 }
 *         limit: { type: integer, example: 10 }
 *         total: { type: integer, example: 23 }
 *         pages: { type: integer, example: 3 }
 *
 *     AdminOrderRow:
 *       type: object
 *       properties:
 *         _id: { type: string, example: "68a8d65e12e1763965a32a72" }
 *         status: { $ref: '#/components/schemas/OrderStatus' }
 *         totalCents: { type: integer, example: 46500 }
 *         createdAt: { type: string, format: date-time, example: "2025-08-22T20:41:16.021Z" }
 *         user:
 *           type: object
 *           properties:
 *             _id: { type: string, example: "6892747b6e6b7701bde7ed68" }
 *             name: { type: string, example: "Carlos" }
 *             email: { type: string, example: "carlos@example.com" }
 *
 *     PaginatedOrders:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/AdminOrderRow' }
 *         page: { type: integer, example: 1 }
 *         limit: { type: integer, example: 10 }
 *         total: { type: integer, example: 9 }
 *         pages: { type: integer, example: 1 }
 *
 *     TopProductsRow:
 *       type: object
 *       properties:
 *         productId: { type: string, example: "66cfd0f73e5f5d0d3c9b1a2e" }
 *         name: { type: string, example: "Cable HDMI 2.1" }
 *         units: { type: integer, example: 9 }
 *         revenueCents: { type: integer, example: 250000 }
 *         revenueMXN: { type: number, example: 2500 }
 */

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: "Usuarios obtenidos" }
 *                 data: { $ref: '#/components/schemas/PaginatedUsers' }
 *       401: { description: No autenticado }
 *       403: { description: No autorizado (se requiere rol admin) }
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
 *           $ref: '#/components/schemas/OrderStatus'
 *         description: Filtrar por estado
 *         examples:
 *           pagadas: { value: paid }
 *           canceladas: { value: canceled }
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: "Órdenes obtenidas" }
 *                 data: { $ref: '#/components/schemas/PaginatedOrders' }
 *       400: { description: Parámetros inválidos }
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
 *             $ref: '#/components/schemas/UpdateOrderStatus'
 *           examples:
 *             Cancelar:
 *               value: { "status": "canceled" }
 *             MarcarComoPagada:
 *               value: { "status": "paid" }
 *             RequierePago:
 *               value: { "status": "requires_payment" }
 *     responses:
 *       200: { description: Estado actualizado }
 *       400: { description: Transición inválida o datos inválidos }
 *       404: { description: Orden no encontrada }
 */
router.patch(
  '/orders/:id/status',
  sensitiveLimiter, // límite más estricto
  updateOrderStatusValidator,
  validate,
  adminController.updateOrderStatus
);

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: "Reporte generado" }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/TopProductsRow' }
 */
router.get('/reports/top-products', topProductsValidator, validate, adminController.reportTopProducts);

module.exports = router;
