const isAdminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado: solo admins' });
  }
  next();
};

module.exports = isAdminMiddleware;
