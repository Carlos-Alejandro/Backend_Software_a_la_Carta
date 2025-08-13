const { body, param } = require('express-validator');

const addItemValidator = [
  body('productId').notEmpty().isMongoId().withMessage('productId inválido'),
  body('quantity').notEmpty().isInt({ min: 1 }).withMessage('quantity debe ser un entero >= 1'),
];

const updateItemValidator = [
  param('productId').isMongoId().withMessage('productId inválido'),
  body('quantity').notEmpty().isInt({ min: 0 }).withMessage('quantity debe ser un entero >= 0'),
];

const removeItemValidator = [
  param('productId').isMongoId().withMessage('productId inválido'),
];

module.exports = { addItemValidator, updateItemValidator, removeItemValidator };
