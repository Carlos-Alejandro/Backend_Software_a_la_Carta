const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, {
      message: 'Errores de validación',
      statusCode: 400,
      error: errors.array(),  // ✅ consistente con ApiError
    });
  }
  next();
};

module.exports = validate;
