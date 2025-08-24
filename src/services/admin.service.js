// src/services/admin.service.js
const User = require('../models/user.model');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const mongoose = require('mongoose');

function toInt(n, def) {
  const x = parseInt(n, 10);
  return Number.isFinite(x) && x > 0 ? x : def;
}

async function listUsers({ page = 1, limit = 10, q = '', role }) {
  const filters = {};
  if (role) filters.role = role;
  if (q) {
    const rx = new RegExp(q, 'i');
    filters.$or = [{ name: rx }, { email: rx }];
  }
  const p = toInt(page, 1);
  const l = toInt(limit, 10);
  const [items, total] = await Promise.all([
    User.find(filters).select('_id name email role createdAt').sort({ createdAt: -1 }).skip((p - 1) * l).limit(l),
    User.countDocuments(filters),
  ]);
  return { items, page: p, limit: l, total, pages: Math.ceil(total / l) };
}

async function updateUserRole(userId, role) {
  return User.findByIdAndUpdate(userId, { role }, { new: true }).select('_id name email role createdAt');
}

function buildOrderMatch({ status, from, to, userId }) {
  const $and = [];
  if (status) $and.push({ status });
  if (userId && mongoose.isValidObjectId(userId)) $and.push({ userId: new mongoose.Types.ObjectId(userId) });
  if (from || to) {
    const createdAt = {};
    if (from) createdAt.$gte = new Date(from);
    if (to) createdAt.$lte = new Date(to);
    $and.push({ createdAt });
  }
  return $and.length ? { $and } : {};
}

async function listOrders({ page = 1, limit = 10, status, from, to, userId }) {
  const match = buildOrderMatch({ status, from, to, userId });
  const p = toInt(page, 1);
  const l = toInt(limit, 10);

  const pipeline = [
    { $match: match },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 1,
        status: 1,
        totalCents: 1,
        createdAt: 1,
        user: { _id: '$user._id', name: '$user.name', email: '$user.email' },
      },
    },
    { $skip: (p - 1) * l },
    { $limit: l },
  ];

  const [items, totalAgg] = await Promise.all([
    Order.aggregate(pipeline),
    Order.aggregate([{ $match: match }, { $count: 'total' }]),
  ]);

  const total = totalAgg[0]?.total || 0;
  return { items, page: p, limit: l, total, pages: Math.ceil(total / l) };
}

async function getOrderById(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Order.findById(id)
    .populate('items.productId', 'name priceCents')
    .populate('userId', 'name email')
    .lean();
}

// Transiciones: nos ceñimos a los estados definidos por tu esquema actual
const ALLOWED = ['pending', 'requires_payment', 'paid', 'failed', 'canceled'];

async function updateOrderStatus(id, nextStatus) {
  if (!mongoose.isValidObjectId(id)) return null;
  if (!ALLOWED.includes(nextStatus)) return null;
  // Para esta fase: permitimos cambiar a 'canceled' si no está 'paid'
  const order = await Order.findById(id);
  if (!order) return null;
  if (order.status === 'paid' && nextStatus === 'canceled') {
    // Reembolsos: fuera de alcance de Fase 5 (requiere Stripe refunds).
    return null;
  }
  order.status = nextStatus;
  await order.save();
  return order;
}

// Reporte: top productos por unidades y revenue (MXN) a partir de items.unitPriceCents * quantity
async function reportTopProducts({ from, to, limit = 10 }) {
  const match = buildOrderMatch({ status: 'paid', from, to }); // contamos ventas pagadas
  const pipeline = [
    { $match: match },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        units: { $sum: '$items.quantity' },
        revenueCents: {
          $sum: { $multiply: ['$items.quantity', { $ifNull: ['$items.unitPriceCents', 0] }] },
        },
      },
    },
    { $sort: { revenueCents: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $project: {
        productId: '$_id',
        name: '$product.name',
        units: 1,
        revenueCents: 1,
        revenueMXN: { $divide: ['$revenueCents', 100] },
      },
    },
  ];
  return Order.aggregate(pipeline);
}

module.exports = {
  listUsers,
  updateUserRole,
  listOrders,
  getOrderById,
  updateOrderStatus,
  reportTopProducts,
};
