const mongoose = require('mongoose');
const { toCents, toPesos } = require('../utils/money');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    // MXN con decimales (compatibilidad con tu front/Swagger)
    price: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    // ✅ Fuente de verdad: centavos (entero)
    priceCents: {
      type: Number,
      required: true,
      min: [0, 'El precio en centavos no puede ser negativo'],
    },
    stock: {
      type: Number,
      required: [true, 'El stock es obligatorio'],
      min: [0, 'El stock no puede ser negativo'],
    },
    imageUrl: {
      type: String,
      default: '',
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'La categoría es obligatoria'],
    },
  },
  { timestamps: true }
);

// Mantener price (MXN) <-> priceCents (centavos) siempre consistentes
productSchema.pre('validate', function (next) {
  // Si modificaron price y no hay priceCents, derivarlo
  if (this.isModified('price') && (this.priceCents == null)) {
    this.priceCents = toCents(this.price);
  }
  // Si modificaron priceCents y falta price, derivarlo
  if (this.isModified('priceCents') && (this.price == null)) {
    this.price = toPesos(this.priceCents);
  }
  // Por si viene solo uno de los dos en creación
  if (this.priceCents == null && this.price != null) {
    this.priceCents = toCents(this.price);
  }
  if (this.price == null && this.priceCents != null) {
    this.price = toPesos(this.priceCents);
  }
  next();
});

productSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret.createdAt;
    delete ret.updatedAt;
    return ret;
  }
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
