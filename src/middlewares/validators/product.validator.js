const { body } = require('express-validator');

const validateProduct = [
  body('name')
    .notEmpty()
    .withMessage('El nombre del producto es obligatorio'),

  body('description')
    .optional()
    .isString()
    .withMessage('La descripción debe ser texto'),

  body('price')
    .notEmpty()
    .withMessage('El precio es obligatorio')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),

  body('stock')
    .notEmpty()
    .withMessage('El stock es obligatorio')
    .isInt({ min: 0 })
    .withMessage('El stock debe ser un número entero positivo'),

  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('La imagen debe ser una URL válida'),

  body('categoryId')
    .notEmpty()
    .withMessage('La categoría es obligatoria')
    .isMongoId()
    .withMessage('ID de categoría no válido'),
];

module.exports = {
  validateProduct,
};
