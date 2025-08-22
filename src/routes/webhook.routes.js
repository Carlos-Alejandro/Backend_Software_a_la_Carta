const express = require('express');
const router = express.Router();
const { stripeWebhook } = require('../controllers/webhook.controller');

// ⚠️ Esta ruta usa body RAW (no JSON) para verificar la firma de Stripe
router.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

module.exports = router;
