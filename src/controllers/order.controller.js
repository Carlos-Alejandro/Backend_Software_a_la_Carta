// src/controllers/order.controller.js
const orderService = require('../services/order.service');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../middlewares/asyncHandler');

// Crea checkout y PaymentIntent en Stripe
const checkout = asyncHandler(async (req, res) => {
  const { order, clientSecret } = await orderService.createCheckout(req.user.id);

  return successResponse(res, {
    message: 'Checkout creado',
    data: {
      orderId: String(order._id),
      paymentIntentId: order.paymentIntentId,
      clientSecret,
      total: order.total,
      currency: order.currency,
    },
    statusCode: 201,
  });
});

// Confirma pago y finaliza orden
const confirm = asyncHandler(async (req, res) => {
  const { orderId, paymentIntentId } = req.body;
  const order = await orderService.confirmAndFinalize(req.user.id, { orderId, paymentIntentId });

  return successResponse(res, {
    message: 'Pago confirmado y orden completada',
    data: order,
  });
});

// Lista órdenes del usuario
const myOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.listMyOrders(req.user.id);
  return successResponse(res, { message: 'Órdenes obtenidas', data: orders });
});

module.exports = { checkout, confirm, myOrders };
