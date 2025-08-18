// src/controllers/order.controller.js
const orderService = require('../services/order.service');
const { successResponse, errorResponse } = require('../utils/response');

const checkout = async (req, res) => {
  try {
    const { order, clientSecret } = await orderService.createCheckout(req.user.id);
    return successResponse(res, {
      message: 'Checkout creado',
      data: { orderId: String(order._id), paymentIntentId: order.paymentIntentId,clientSecret, total: order.total, currency: order.currency },
      statusCode: 201,
    });
  } catch (error) {
    const status = error.statusCode || 400;
    return errorResponse(res, { message: error.message, statusCode: status });
  }
};

const confirm = async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;
    const order = await orderService.confirmAndFinalize(req.user.id, { orderId, paymentIntentId });
    return successResponse(res, { message: 'Pago confirmado y orden completada', data: order });
  } catch (error) {
    const status = error.statusCode || 400;
    return errorResponse(res, { message: error.message, statusCode: status });
  }
};

const myOrders = async (req, res) => {
  try {
    const orders = await orderService.listMyOrders(req.user.id);
    return successResponse(res, { message: 'Órdenes obtenidas', data: orders });
  } catch (error) {
    const status = error.statusCode || 400;
    return errorResponse(res, { message: error.message, statusCode: status });
  }
};

module.exports = { checkout, confirm, myOrders };
