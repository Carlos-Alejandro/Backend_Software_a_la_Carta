// src/services/admin.service.js
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Order = require('../models/order.model');
const Product = require('../models/product.model');

// Transiciones permitidas (según tu esquema actual)
const ALLOWED = ['pending', 'requires_payment', 'paid', 'failed', 'canceled'];

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
    User.find(filters)
      .select('_id name email role')         // no createdAt
      .sort({ createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .lean(),
    User.countDocuments(filters),
  ]);

  return { items, page: p, limit: l, total, pages: Math.ceil(total / l) };
}

async function updateUserRole(userId, role) {
  return User.findByIdAndUpdate(userId, { role }, { new: true })
    .select('_id name email role')
    .lean();
}

function buildOrderMatch({ status, from, to, userId }) {
  const $and = [];
  if (status) $and.push({ status });
  if (userId && mongoose.isValidObjectId(userId)) {
    $and.push({ userId: new mongoose.Types.ObjectId(userId) });
  }
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

/**
 * Actualiza solo el estado sin revalidar todo el documento (desbloquea órdenes legacy
 * que no tienen totalCents). Mantiene la regla: no pasar de paid -> canceled.
 */
async function updateOrderStatus(id, nextStatus) {
  if (!mongoose.isValidObjectId(id)) return null;
  if (!ALLOWED.includes(nextStatus)) return null;

  const current = await Order.findById(id).lean();
  if (!current) return null;
  if (current.status === 'paid' && nextStatus === 'canceled') return null;

  const r = await Order.updateOne({ _id: id }, { $set: { status: nextStatus } });
  if (!r.matchedCount) return null;

  return Order.findById(id).lean();
}

// Reporte: top productos por unidades y revenue (MXN)
async function reportTopProducts({ from, to, limit = 10 }) {
  const match = buildOrderMatch({ status: 'paid', from, to }); // solo ventas pagadas
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
        _id: 0,
        productId: { $toString: '$_id' }, // <- string directo
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
