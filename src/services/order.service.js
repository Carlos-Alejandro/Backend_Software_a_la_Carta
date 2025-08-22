// src/services/order.service.js
const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const getStripe = require('../config/stripe');
const { HttpError } = require('../utils/httpError');
const { toCents, toPesos } = require('../utils/money');

const CURRENCY = (process.env.CURRENCY || 'mxn').toLowerCase();

/**
 * Construye un borrador de orden desde el carrito.
 * Calcula totales en CENTAVOS (enteros) como fuente de verdad,
 * y también devuelve el total en MXN (decimales) por compatibilidad.
 */
async function buildOrderDraftFromCart(userId) {
  const cart = await Cart.findOne({ userId })
    .populate('items.productId', 'name price priceCents stock');

  if (!cart || cart.items.length === 0) {
    throw new HttpError('Carrito vacío', 400);
  }

  const items = cart.items.map((i) => {
    if (!i.productId) throw new HttpError('Producto no encontrado', 404);
    if (i.productId.stock < i.quantity) {
      throw new HttpError(
        `Stock insuficiente para ${i.productId.name}. Disponibles: ${i.productId.stock}. Solicitados: ${i.quantity}`,
        409
      );
    }

    // Fuente de verdad del precio por ítem en centavos
    const unitPriceCents = (typeof i.productId.priceCents === 'number')
      ? i.productId.priceCents
      : toCents(i.productId.price);

    return {
      productId: i.productId._id,
      name: i.productId.name,     // denormalización para histórico
      price: i.productId.price,   // MXN (compatibilidad con tu front/Swagger)
      unitPriceCents,             // ✅ entero (verdad)
      quantity: i.quantity,
    };
  });

  const totalCents = items.reduce((acc, it) => acc + (it.unitPriceCents * it.quantity), 0);
  if (!Number.isFinite(totalCents) || totalCents < 1) {
    throw new HttpError('El total de la orden debe ser mayor a 0', 400);
  }

  return { items, totalCents, total: toPesos(totalCents) };
}

/**
 * Crea la Order en estado requires_payment y el PaymentIntent en Stripe.
 * Stripe siempre recibe montos en centavos (enteros).
 */
async function createCheckout(userId) {
  const stripe = getStripe();
  const draft = await buildOrderDraftFromCart(userId);

  // 1) Crear Order (guardamos verdad en totalCents y compat en total)
  const order = await Order.create({
    userId,
    items: draft.items,
    total: draft.total,               // MXN (compat)
    totalCents: draft.totalCents,     // ✅ entero (verdad)
    status: 'requires_payment',
    currency: CURRENCY,
  });

  // 2) Crear PaymentIntent en Stripe con centavos
  const amountInCents = draft.totalCents;

  // Guard defensivo por límites de Stripe (2 decimales): 999,999.99 → 99_999_999 centavos
  const STRIPE_MAX = 99_999_999;
  if (!Number.isFinite(amountInCents) || amountInCents < 1 || amountInCents > STRIPE_MAX) {
    throw new HttpError('Total fuera de rango para Stripe (0 < total ≤ 999,999.99 MXN)', 400);
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,            // ← centavos
    currency: CURRENCY,
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderId: order._id.toString(),
      userId: userId.toString(),
    },
  });

  order.paymentIntentId = paymentIntent.id;
  await order.save();

  return { order, clientSecret: paymentIntent.client_secret };
}

/**
 * Confirmar (vía PI ya "succeeded") y finalizar:
 * - validar monto/moneda/metadata
 * - descontar stock
 * - vaciar carrito
 * - marcar orden como "paid"
 * Todo dentro de una transacción atómica.
 */
async function confirmAndFinalize(userId, { orderId, paymentIntentId }) {
  const stripe = getStripe();

  // Trae orden (fuera de la transacción para validar PI primero)
  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) throw new HttpError('Orden no encontrada', 404);

  // Idempotencia
  if (order.status === 'paid') return order;

  if (!order.paymentIntentId || order.paymentIntentId !== paymentIntentId) {
    throw new HttpError('PaymentIntent no coincide con la orden', 400);
  }

  // Valida el PaymentIntent en Stripe
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (pi.status !== 'succeeded') {
    throw new HttpError(`El pago aún no está completado (status=${pi.status})`, 400);
  }

  // ✅ Validación de monto y moneda en CENTAVOS
  const expected = (typeof order.totalCents === 'number')
    ? order.totalCents
    : toCents(order.total); // fallback por si hubiera legacy

  if (pi.amount !== expected) {
    throw new HttpError(`Monto no coincide (esperado ${expected}, Stripe ${pi.amount})`, 400);
  }

  if ((pi.currency || '').toLowerCase() !== CURRENCY) {
    throw new HttpError('Moneda no coincide', 400);
  }

  // Metadatos esperados
  if (pi.metadata?.orderId !== String(order._id) || pi.metadata?.userId !== String(userId)) {
    throw new HttpError('Metadatos del PaymentIntent no corresponden a la orden/usuario', 400);
  }

  // Transacción: descontar stock, vaciar carrito y marcar pagada
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // 1) Descontar stock con guard (evita negativos)
      for (const it of order.items) {
        const res = await Product.updateOne(
          { _id: it.productId, stock: { $gte: it.quantity } },
          { $inc: { stock: -it.quantity } },
          { session }
        );
        if (res.modifiedCount !== 1) {
          throw new HttpError(`Stock insuficiente al finalizar para producto ${it.productId}`, 409);
        }
      }

      // 2) Vaciar carrito del usuario
      await Cart.updateOne({ userId }, { $set: { items: [] } }, { session });

      // 3) Marcar orden como pagada (idempotente)
      await Order.updateOne(
        { _id: order._id, status: { $ne: 'paid' } },
        { $set: { status: 'paid' } },
        { session }
      );
    }, {
      readPreference: 'primary',
      readConcern: { level: 'local' },
      writeConcern: { w: 'majority' },
    });
  } catch (err) {
    // Mensaje claro si no hay réplica set
    if (/replica set/i.test(err?.message || '')) {
      throw new HttpError(
        'Las transacciones requieren MongoDB en réplica set. En local: inicia el servidor con --replSet y ejecuta rs.initiate().',
        500
      );
    }
    throw err;
  } finally {
    await session.endSession();
  }

  // Devuelve la orden actualizada
  return await Order.findById(order._id).lean();
}

async function listMyOrders(userId) {
  return Order.find({ userId }).sort({ createdAt: -1 }).lean();
}

module.exports = {
  createCheckout,
  confirmAndFinalize,
  listMyOrders,
};
