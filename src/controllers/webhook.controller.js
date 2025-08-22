// src/controllers/webhook.controller.js
const getStripe = require('../config/stripe');
const Order = require('../models/order.model');
const { confirmAndFinalize } = require('../services/order.service');

const stripe = getStripe();

async function stripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    // ⚠️ req.body es RAW (Buffer) por express.raw en la ruta
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('[Webhook] Firma inválida:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const orderId = pi.metadata?.orderId;
        const userId = pi.metadata?.userId;

        if (!orderId || !userId) {
          console.warn('[Webhook] Falta metadata orderId/userId en PI', pi.id);
          break; // No podemos asociar a una orden → ignoramos
        }

        // Idempotencia: si ya está pagada, no disparamos nada
        const existing = await Order.findById(orderId).lean();
        if (!existing) break;
        if (existing.status === 'paid') break;

        // Reutiliza tu servicio (valida monto/moneda/metadata y hace la transacción)
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
        // Otros eventos: ignoramos por ahora
        break;
    }

    // Responder 200 SIEMPRE que la firma sea válida
    // (si quieres que Stripe reintente ante fallas, devuelve 500 en catch)
    return res.json({ received: true });
  } catch (err) {
    console.error('[Webhook] Error procesando evento', event?.id, err);
    // Devolver 500 hace que Stripe reintente más tarde
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

module.exports = { stripeWebhook };
