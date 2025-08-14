// src/routes/order.routes.js
const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.middleware');
const orderController = require('../controllers/order.controller');
const validate = require('../middlewares/validate.middleware');
const { confirmValidator } = require('../middlewares/validators/order.validator');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Órdenes y pagos con Stripe
 */

/**
 * @swagger
 * /api/orders/checkout:
 *   post:
 *     summary: Crear checkout desde el carrito (genera un PaymentIntent y una orden en estado requires_payment)
 *     description: Construye la orden a partir del carrito del usuario autenticado, valida stock y crea un PaymentIntent en Stripe.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Checkout creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/CheckoutSuccess"
 *       400:
 *         description: Error de validación/lógica (carrito vacío, stock insuficiente, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiError"
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       409:
 *         $ref: "#/components/responses/ConflictError"
 */
router.post('/checkout', auth, orderController.checkout);

/**
 * @swagger
 * /api/orders/confirm:
 *   post:
 *     summary: Confirmar pago y completar orden
 *     description: Verifica el PaymentIntent en Stripe y, si el pago está "succeeded", descuenta stock, vacía el carrito y marca la orden como "paid".
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ConfirmPaymentRequest"
 *     responses:
 *       200:
 *         description: Pago confirmado y orden completada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ConfirmPaymentSuccess"
 *       400:
 *         description: PaymentIntent no coincide / pago no completado / validación fallida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiError"
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       404:
 *         $ref: "#/components/responses/NotFound"
 *       409:
 *         $ref: "#/components/responses/ConflictError"
 */
router.post('/confirm', auth, confirmValidator, validate, orderController.confirm);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Listar mis órdenes (más recientes primero)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de órdenes del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/MyOrdersSuccess"
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 */
router.get('/', auth, orderController.myOrders);

module.exports = router;
