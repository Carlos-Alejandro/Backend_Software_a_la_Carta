// src/models/order.model.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name:      { type: String, required: true },  // denormalización (histórico)
    price:     { type: Number, required: true },
    quantity:  { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items:           { type: [orderItemSchema], default: [] },
    total:           { type: Number, required: true, min: 0 },
    status:          { type: String, enum: ['pending','requires_payment','paid','failed','canceled'], default: 'pending' },
    paymentIntentId: { type: String, default: null },
    currency:        { type: String, default: process.env.CURRENCY || 'mxn' },
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
