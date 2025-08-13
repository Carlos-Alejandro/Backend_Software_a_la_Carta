const jwt = require('jsonwebtoken');
const { HttpError } = require('../utils/httpError');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next(new HttpError('Token no proporcionado', 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch {
    return next(new HttpError('Token inválido o expirado', 401));
  }
};

module.exports = authMiddleware;
