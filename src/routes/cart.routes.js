const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { addItemValidator, updateItemValidator, removeItemValidator } = require('../middlewares/validators/cart.validator');
const cartController = require('../controllers/cart.controller');

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Endpoints del carrito (usuario autenticado)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AddToCartRequest:
 *       type: object
 *       required: [productId, quantity]
 *       properties:
 *         productId:
 *           type: string
 *           example: 64d989bdfc13ae1739000025
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *     UpdateCartItemRequest:
 *       type: object
 *       required: [quantity]
 *       properties:
 *         quantity:
 *           type: integer
 *           minimum: 0
 *           example: 3
 *     CartItemResponse:
 *       type: object
 *       properties:
 *         product:
 *           type: object
 *           properties:
 *             _id: { type: string }
 *             name: { type: string }
 *             price: { type: number }
 *             imageUrl: { type: string }
 *             categoryId: { type: string }
 *         quantity:
 *           type: integer
 *         subtotal:
 *           type: number
 *     CartResponse:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItemResponse'
 *         total:
 *           type: number
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Obtener mi carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrito del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartResponse'
 */
router.get('/', auth, cartController.getMyCart);

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     summary: Agregar producto al carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddToCartRequest'
 *     responses:
 *       201:
 *         description: Ítem agregado
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/items', auth, addItemValidator, validate, cartController.addItem);

/**
 * @swagger
 * /api/cart/items/{productId}:
 *   put:
 *     summary: Actualizar cantidad de un ítem
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCartItemRequest'
 *     responses:
 *       200:
 *         description: Ítem actualizado
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/items/:productId', auth, updateItemValidator, validate, cartController.updateItem);

/**
 * @swagger
 * /api/cart/items/{productId}:
 *   delete:
 *     summary: Eliminar ítem del carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ítem eliminado
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/items/:productId', auth, removeItemValidator, validate, cartController.removeItem);

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Vaciar carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrito vacío
 */
router.delete('/', auth, cartController.clear);

module.exports = router;
