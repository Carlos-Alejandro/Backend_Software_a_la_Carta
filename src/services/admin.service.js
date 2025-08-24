// src/services/admin.service.js
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Order = require('../models/order.model');

// Estados permitidos (alineados con el esquema)
const ALLOWED = ['pending', 'requires_payment', 'paid', 'failed', 'canceled'];

/** convierte string->int con default y piso en 1 */
function toInt(n, def) {
  const x = parseInt(n, 10);
  return Number.isFinite(x) && x > 0 ? x : def;
}

/** -------------------- USERS (ADMIN) -------------------- **/
async function listUsers({ page = 1, limit = 10, q = '', role }) {
  const filters = {};
  if (role) filters.role = role;
  if (q) {
    const rx = new RegExp(q, 'i');
    filters.$or = [{ name: rx }, { email: rx }];
  }

  const p = toInt(page, 1);
  const l = Math.min(100, toInt(limit, 10));

  const [items, total] = await Promise.all([
    User.find(filters)
      .select('_id name email role') // sin createdAt/updatedAt/__v
      .sort({ createdAt: -1, _id: -1 })
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

/** -------------------- ORDERS (ADMIN) -------------------- **/
function buildOrderMatch({ status, from, to, userId }) {
  const $and = [];

  if (status && ALLOWED.includes(status)) $and.push({ status });

  if (userId && mongoose.isValidObjectId(userId)) {
    $and.push({ userId: new mongoose.Types.ObjectId(userId) });
  }

  if (from || to) {
    const createdAt = {};
    if (from) {
      const f = new Date(from);
      if (!isNaN(f.getTime())) createdAt.$gte = f;
    }
    if (to) {
      const t = new Date(to);
      if (!isNaN(t.getTime())) createdAt.$lte = t;
    }
    if (Object.keys(createdAt).length) $and.push({ createdAt });
  }

  return $and.length ? { $and } : {};
}

async function listOrders({ page = 1, limit = 10, status, from, to, userId }) {
  const match = buildOrderMatch({ status, from, to, userId });
  const p = toInt(page, 1);
  const l = Math.min(100, toInt(limit, 10));

  const pipeline = [
    { $match: match },
    { $sort: { createdAt: -1, _id: -1 } },
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
        createdAt: 1, // si usas successResponse + omitMeta, no se expondrá
        user: {
          _id: '$user._id',
          name: '$user.name',
          email: '$user.email',
        },
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
 * Actualiza SOLO el estado (evita revalidar todo el doc y desbloquea órdenes “legacy”
 * que pudieran carecer de campos requeridos como totalCents).
 * Regla: no permite paid -> canceled.
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

/** -------------------- REPORTES (ADMIN) -------------------- **/
/**
 * Top productos por unidades y revenue (MXN) a partir de items.unitPriceCents * quantity.
 * Solo cuenta órdenes con status 'paid'.
 */
async function reportTopProducts({ from, to, limit = 10 }) {
  const match = buildOrderMatch({ status: 'paid', from, to });
  const l = Math.min(100, toInt(limit, 10));

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
    { $sort: { revenueCents: -1, units: -1 } },
    { $limit: l },
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
        productId: { $toString: '$_id' }, // IDs legibles
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
