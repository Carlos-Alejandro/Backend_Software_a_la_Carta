// src/routes/order.routes.js
const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.middleware');
const orderController = require('../controllers/order.controller');
const validate = require('../middlewares/validate.middleware');
const {
  confirmValidator,
  checkoutValidator,
} = require('../middlewares/validators/order.validator');

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
 *     description: >
 *       Construye la orden a partir del carrito del usuario autenticado, valida stock y crea un PaymentIntent en Stripe.  
 *       **Notas**:
 *       - Todos los montos se cobran en **MXN**.
 *       - El campo `currency` enviado por el cliente **no es aceptado** (se fuerza MXN en el backend).
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethodId:
 *                 type: string
 *                 example: "pm_1NXyzAbc123..."
 *               savePaymentMethod:
 *                 type: boolean
 *                 example: false
 *               force3ds:
 *                 type: boolean
 *                 example: false
 *           examples:
 *             sinBody:
 *               summary: Sin body (lo más común)
 *               value: {}
 *             conOpcionales:
 *               summary: Con campos opcionales
 *               value:
 *                 paymentMethodId: "pm_1NXyzAbc123..."
 *                 savePaymentMethod: false
 *                 force3ds: false
 *     responses:
 *       201:
 *         description: Checkout creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/CheckoutSuccess"
 *       400:
 *         description: Error de validación/lógica (carrito vacío, stock insuficiente, payload inválido, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiError"
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       409:
 *         $ref: "#/components/responses/ConflictError"
 */
router.post('/checkout', auth, checkoutValidator, validate, orderController.checkout);

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
