const { HttpError } = require('../utils/httpError');

const isAdminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return next(new HttpError('Acceso denegado: solo admins', 403));
  }
  next();
};

module.exports = isAdminMiddleware;
