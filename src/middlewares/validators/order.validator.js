// src/middlewares/validators/order.validator.js
const { body } = require('express-validator');

/** Rechaza que el cliente mande `currency` (siempre forzamos MXN en el backend) */
const rejectClientCurrency = body('currency').custom((_, { req }) => {
  if (Object.prototype.hasOwnProperty.call(req.body ?? {}, 'currency')) {
    throw new Error('currency no permitido; el sistema fuerza MXN en el servidor');
  }
  return true;
});

/**
 * POST /orders/confirm
 * Requisitos:
 * - orderId: ObjectId de Mongo
 * - paymentIntentId: id de Stripe que empieza con "pi_"
 */
const confirmValidator = [
  body('orderId')
    .exists({ checkFalsy: true }).withMessage('orderId es requerido')
    .bail()
    .isMongoId().withMessage('orderId debe ser un ObjectId válido')
    .bail()
    .customSanitizer((v) => String(v).trim()),

  body('paymentIntentId')
    .exists({ checkFalsy: true }).withMessage('paymentIntentId es requerido')
    .bail()
    .isString().withMessage('paymentIntentId debe ser una cadena')
    .bail()
    .matches(/^pi_[A-Za-z0-9_]+$/).withMessage('paymentIntentId inválido (debe iniciar con "pi_")')
    .bail()
    .customSanitizer((v) => String(v).trim()),
];

/**
 * POST /orders/checkout
 * No aceptamos `currency` (se fuerza a MXN en el servidor).
 * Campos opcionales típicos del checkout.
 */
const checkoutValidator = [
  rejectClientCurrency,

  body('savePaymentMethod')
    .optional()
    .isBoolean().withMessage('savePaymentMethod debe ser booleano')
    .toBoolean(),

  body('force3ds')
    .optional()
    .isBoolean().withMessage('force3ds debe ser booleano')
    .toBoolean(),

  body('paymentMethodId')
    .optional({ checkFalsy: true })
    .isString().withMessage('paymentMethodId debe ser una cadena')
    .bail()
    .matches(/^pm_[A-Za-z0-9_]+$/).withMessage('paymentMethodId inválido (debe iniciar con "pm_")')
    .bail()
    .customSanitizer((v) => String(v).trim()),
];

module.exports = {
  confirmValidator,
  checkoutValidator,
};
