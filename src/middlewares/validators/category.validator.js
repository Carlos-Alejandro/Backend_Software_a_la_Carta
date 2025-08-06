const { body } = require('express-validator');

const validateCategory = [
  body('name')
    .notEmpty()
    .withMessage('El nombre de la categoría es obligatorio'),
  body('description')
    .optional()
    .isString()
    .withMessage('La descripción debe ser texto'),
];

module.exports = {
  validateCategory,
};
