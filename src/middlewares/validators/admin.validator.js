// src/middlewares/validators/admin.validator.js
const { query, param, body } = require('express-validator');

const commonPage = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

const listUsersValidator = [
  ...commonPage,
  query('q').optional().isString(),
  query('role').optional().isIn(['user', 'admin']),
];

const updateUserRoleValidator = [
  param('id').isMongoId(),
  body('role').isIn(['user', 'admin']),
];

const listOrdersValidator = [
  ...commonPage,
  query('status').optional().isIn(['pending', 'requires_payment', 'paid', 'failed', 'canceled']),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('userId').optional().isMongoId(),
];

const updateOrderStatusValidator = [
  param('id').isMongoId(),
  body('status').isIn(['pending', 'requires_payment', 'paid', 'failed', 'canceled']),
];

const topProductsValidator = [
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

module.exports = {
  listUsersValidator,
  updateUserRoleValidator,
  listOrdersValidator,
  updateOrderStatusValidator,
  topProductsValidator,
};
