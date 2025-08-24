// src/controllers/webhook.controller.js
const getStripe = require('../config/stripe');
const Order = require('../models/order.model');
const { confirmAndFinalize } = require('../services/order.service');
const logger = require('../utils/logger');

const stripe = getStripe();

/**
 * IMPORTANTE:
 * La ruta que monta este handler debe usar express.raw({ type: 'application/json' })
 * en el router (antes de express.json global). Ej:
 *
 *  const router = require('express').Router();
 *  router.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhook);
 *  module.exports = router;
 */
async function stripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    // req.body es RAW (Buffer) gracias a express.raw en la ruta
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    logger.warn('stripe.signature_invalid', { reqId: req.id, message: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    logger.info('stripe.event.received', { reqId: req.id, eventId: event.id, type: event.type });

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const orderId = pi.metadata?.orderId;
        const userId = pi.metadata?.userId;

        if (!orderId || !userId) {
          logger.warn('stripe.metadata.missing', { reqId: req.id, eventId: event.id, paymentIntent: pi.id });
          break;
        }

        // Idempotencia: si ya está pagada, no proceses de nuevo
        const existing = await Order.findById(orderId).lean();
        if (!existing) break;
        if (existing.status === 'paid') break;

        // Valida y cierra la orden (tu servicio debe verificar montos/moneda)
        await confirmAndFinalize(userId, { orderId, paymentIntentId: pi.id });
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const orderId = pi.metadata?.orderId;
        if (orderId) {
          await Order.updateOne(
            { _id: orderId, status: { $ne: 'paid' } },
            { $set: { status: 'failed' } }
          );
        }
        break;
      }

      case 'payment_intent.canceled': {
        const pi = event.data.object;
        const orderId = pi.metadata?.orderId;
        if (orderId) {
          await Order.updateOne(
            { _id: orderId, status: { $ne: 'paid' } },
            { $set: { status: 'canceled' } }
          );
        }
        break;
      }

      default:
        // Otros eventos actualmente no se usan
        break;
    }

    logger.info('stripe.event.processed', { reqId: req.id, eventId: event.id, type: event.type });
    // Firma válida y procesamiento ok ⇒ 200
    return res.json({ received: true });
  } catch (err) {
    logger.error('stripe.event.failed', {
      reqId: req.id,
      eventId: event?.id,
      type: event?.type,
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
    // 500 ⇒ Stripe reintentará más tarde
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

module.exports = { stripeWebhook };
