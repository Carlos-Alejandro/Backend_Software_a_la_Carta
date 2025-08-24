const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

router.get('/poke-log', (req, res) => {
  logger.info('[DEV] log de prueba', { rid: req.id });
  res.json({ ok: true, message: 'Se escribió un log en consola/archivo' });
});

module.exports = router;
