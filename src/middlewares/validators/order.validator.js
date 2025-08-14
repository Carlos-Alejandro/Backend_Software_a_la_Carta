// src/middlewares/validators/order.validator.js
const { body } = require('express-validator');

const confirmValidator = [
  body('orderId').notEmpty().isMongoId().withMessage('orderId inválido'),
  body('paymentIntentId').notEmpty().isString().withMessage('paymentIntentId requerido'),
];

module.exports = { confirmValidator };
