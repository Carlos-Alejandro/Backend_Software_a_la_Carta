// src/services/order.service.js
const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const getStripe = require('../config/stripe');
const { HttpError } = require('../utils/httpError');

const CURRENCY = (process.env.CURRENCY || 'mxn').toLowerCase();

async function buildOrderDraftFromCart(userId) {
  const cart = await Cart.findOne({ userId })
    .populate('items.productId', 'name price stock');

  if (!cart || cart.items.length === 0) {
    throw new HttpError('Carrito vacío', 400);
  }

  const items = cart.items.map(i => {
    if (!i.productId) throw new HttpError('Producto no encontrado', 404);
    if (i.productId.stock < i.quantity) {
      throw new HttpError(
        `Stock insuficiente para ${i.productId.name}. Disponibles: ${i.productId.stock}. Solicitados: ${i.quantity}`,
        409
      );
    }
    return {
      productId: i.productId._id,
      name: i.productId.name,
      price: i.productId.price,
      quantity: i.quantity,
    };
  });

  // Mantengo tu cálculo y redondeo tal como lo tenías
  const total = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const totalRounded = Number(total.toFixed(2));
  if (totalRounded <= 0) throw new HttpError('El total de la orden debe ser mayor a 0', 400);

  return { items, total: totalRounded };
}

async function createCheckout(userId) {
  const stripe = getStripe();
  const draft = await buildOrderDraftFromCart(userId);

  // 1) Crear Order "requires_payment"
  const order = await Order.create({
    userId,
    items: draft.items,
    total: draft.total,
    status: 'requires_payment',
    currency: CURRENCY,
  });

  // 2) Crear PaymentIntent en Stripe
  // IMPORTANTE: usamos "draft.total" como ya lo acordamos (total en centavos)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: draft.total,                     // ← total YA en centavos
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

async function confirmAndFinalize(userId, { orderId, paymentIntentId }) {
  const stripe = getStripe();

  // Trae orden (fuera de la transacción para validar PI primero)
  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) throw new HttpError('Orden no encontrada', 404);
  if (order.status === 'paid') return order; // idempotente
  if (!order.paymentIntentId || order.paymentIntentId !== paymentIntentId) {
    throw new HttpError('PaymentIntent no coincide con la orden', 400);
  }

  // Valida el PaymentIntent
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (pi.status !== 'succeeded') {
    throw new HttpError(`El pago aún no está completado (status=${pi.status})`, 400);
  }

  // ✅ Validación de monto y moneda en centavos (coherente con checkout)
  const expected = order.total; // order.total está en centavos (según lo que acordamos)
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

      // 3) Marcar orden como pagada
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
