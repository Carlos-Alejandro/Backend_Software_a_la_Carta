// src/middlewares/logging/requestId.middleware.js
const crypto = require('crypto');

module.exports = function requestId() {
  return (req, res, next) => {
    const hdr = req.header('x-request-id');
    req.id = hdr || (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'));
    res.setHeader('X-Request-Id', req.id);
    next();
  };
};
