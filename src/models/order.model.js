const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name:      { type: String, required: true },   // denormalización para histórico
    // MXN con decimales (compat para tu front/Swagger)
    price:     { type: Number, required: true, min: 0 },
    // ✅ Nuevo: fuente de verdad por ítem en centavos (entero)
    // (no lo hago required para no romper órdenes legacy que no lo tengan)
    unitPriceCents: { type: Number, min: 0 },
    quantity:  { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items:           { type: [orderItemSchema], default: [] },

    // MXN con decimales (compat)
    total:           { type: Number, required: true, min: 0 },
    // ✅ Nuevo: total en centavos (entero, verdad)
    totalCents:      { type: Number, required: true, min: 1 },

    status:          { type: String, enum: ['pending','requires_payment','paid','failed','canceled'], default: 'pending' },
    paymentIntentId: { type: String, default: null },
    currency:        { type: String, default: (process.env.CURRENCY || 'mxn').toLowerCase() },
  },
  { timestamps: true }
);

orderSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret.createdAt;
    delete ret.updatedAt;
    return ret;
  }
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
