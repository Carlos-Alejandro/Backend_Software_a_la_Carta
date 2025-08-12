const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const auth = require('../middlewares/auth.middleware');
const isAdmin = require('../middlewares/isAdmin.middleware');
const validate = require('../middlewares/validate.middleware');
const { validateProduct } = require('../middlewares/validators/product.validator');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Endpoints para gestión de productos
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Obtener todos los productos
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Lista de productos
 */
router.get('/', productController.getAllProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obtener un producto por ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Producto encontrado
 *       404:
 *         description: Producto no encontrado
 */
router.get('/:id', productController.getProductById);

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Modificar parcialmente un producto (solo admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatchProduct'
 *     responses:
 *       200:
 *         description: Producto modificado parcialmente
 *       400:
 *         description: Error de validación o campos incorrectos
 *       404:
 *         description: Producto no encontrado
 */
router.patch('/:id', auth, isAdmin, productController.partialUpdateProduct);



/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Crear un nuevo producto (solo admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Producto creado
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/', auth, isAdmin, validateProduct, validate, productController.createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Actualizar un producto (solo admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Producto actualizado
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', auth, isAdmin, validateProduct, validate, productController.updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Eliminar un producto (solo admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Producto eliminado
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', auth, isAdmin, productController.deleteProduct);

module.exports = router;
