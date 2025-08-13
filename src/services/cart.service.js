const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const { HttpError } = require('../utils/httpError');


// Valida que la cantidad solicitada no exceda el stock disponible
function ensureStockOrThrow(product, requestedAbsoluteQty, existingQty = 0) {
  if (!product) throw new HttpError('Producto no encontrado', 404);
  if (requestedAbsoluteQty < 0) {
    throw new HttpError('La cantidad no puede ser negativa', 400);
  }

  // Para "add": total = existente + nueva; Para "update": total = cantidad absoluta pedida
  const totalDesired = existingQty + requestedAbsoluteQty;

  if (product.stock <= 0) {
    throw new HttpError('Producto sin stock disponible', 409);
  }
  if (totalDesired === 0) {
    // permitido; significa eliminar (lo maneja el controlador/servicio)
    return;
  }
  if (totalDesired > product.stock) {
    throw new HttpError(
      `Stock insuficiente. Disponibles: ${product.stock}. Solicitados: ${totalDesired}`,
      409
    );
  }
}

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }
  return cart;
};

const getCartPopulated = async (userId) => {
  const cart = await getOrCreateCart(userId);
  await cart.populate('items.productId', 'name price imageUrl categoryId stock');
  return cart;
};

const addItem = async (userId, productId, quantity) => {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new HttpError('quantity debe ser un entero >= 1', 400);
  }

  const product = await Product.findById(productId).lean();
  if (!product) throw new HttpError('Producto no encontrado', 404);

  const cart = await getOrCreateCart(userId);
  const idx = cart.items.findIndex(i => String(i.productId) === String(productId));
  const existingQty = idx >= 0 ? cart.items[idx].quantity : 0;

  // add = existente + nueva
  ensureStockOrThrow(product, quantity, existingQty);

  if (idx >= 0) {
    cart.items[idx].quantity = existingQty + quantity;
  } else {
    cart.items.push({ productId, quantity });
  }

  await cart.save();
  return getCartPopulated(userId);
};

const updateItem = async (userId, productId, quantity) => {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new HttpError('quantity debe ser un entero >= 0', 400);
  }

  const product = await Product.findById(productId).lean();
  if (!product) throw new HttpError('Producto no encontrado', 404);

  const cart = await getOrCreateCart(userId);
  const idx = cart.items.findIndex(i => String(i.productId) === String(productId));
  if (idx === -1) throw new HttpError('Ítem no existe en el carrito', 404);

  // update = cantidad absoluta pedida
  ensureStockOrThrow(product, quantity, 0);

  if (quantity === 0) {
    cart.items.splice(idx, 1); // eliminar
  } else {
    cart.items[idx].quantity = quantity;
  }

  await cart.save();
  return getCartPopulated(userId);
};

const removeItem = async (userId, productId) => {
  const cart = await getOrCreateCart(userId);
  cart.items = cart.items.filter(i => String(i.productId) !== String(productId));
  await cart.save();
  return getCartPopulated(userId);
};

const clearCart = async (userId) => {
  const cart = await getOrCreateCart(userId);
  cart.items = [];
  await cart.save();
  return cart;
};

module.exports = {
  getOrCreateCart,
  getCartPopulated,
  addItem,
  updateItem,
  removeItem,
  clearCart,
};
