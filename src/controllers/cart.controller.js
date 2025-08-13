const cartService = require('../services/cart.service');
const { successResponse, errorResponse } = require('../utils/response');

// ===== Helpers para totales rápidos =====
const computeTotals = (cart) => {
  const lines = cart.items?.length || 0;
  const items = (cart.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0);
  const total = (cart.items || []).reduce((acc, i) => {
    const p = i.productId;
    const sub = p?.price ? Number((p.price * i.quantity).toFixed(2)) : 0;
    return acc + sub;
  }, 0);
  return { lines, items, total: Number(total.toFixed(2)) };
};

// ===== Respuesta completa (solo para GET) =====
const mapCartResponse = (cart) => {
  const items = (cart.items || []).map(i => {
    const p = i.productId;
    const subtotal = p?.price ? Number((p.price * i.quantity).toFixed(2)) : 0;
    return {
      product: p ? {
        _id: p._id,
        name: p.name,
        price: p.price,
        imageUrl: p.imageUrl,
        categoryId: p.categoryId,
      } : { _id: i.productId },
      quantity: i.quantity,
      subtotal,
    };
  });
  const totals = computeTotals(cart);
  return { items, total: totals.total };
};

// ===== Respuesta compacta para mutaciones =====
const mapCartMutationResponse = (cart, { productId, action }) => {
  const totals = computeTotals(cart);

  // intentamos reconstruir el item cambiado si existe en el carrito (quantity > 0)
  const found = (cart.items || []).find(i => String(i.productId?._id || i.productId) === String(productId));
  const changedItem = found && found.productId?.price
    ? {
        productId: String(found.productId._id || found.productId),
        quantity: found.quantity,
        unitPrice: found.productId.price,
        subtotal: Number((found.productId.price * found.quantity).toFixed(2)),
      }
    : null;

  return {
    cartId: String(cart._id),
    action,         // "added" | "updated" | "removed" | "cleared"
    changedItem,    // null cuando se elimina o se vacía
    totals,
  };
};

const getMyCart = async (req, res) => {
  try {
    const cart = await cartService.getCartPopulated(req.user.id);
    return successResponse(res, { message: 'Carrito obtenido', data: mapCartResponse(cart) });
  } catch (error) {
    const status = error.statusCode || 400;
    return errorResponse(res, { message: error.message, statusCode: status });
  }
};

const addItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await cartService.addItem(req.user.id, productId, Number(quantity));
    const data = mapCartMutationResponse(cart, { productId, action: 'added' });
    return successResponse(res, { message: 'Ítem agregado al carrito', data, statusCode: 201 });
  } catch (error) {
    const status = error.statusCode || 400;
    return errorResponse(res, { message: error.message, statusCode: status });
  }
};

const updateItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const q = Number(quantity);
    const cart = await cartService.updateItem(req.user.id, productId, q);
    const action = q === 0 ? 'removed' : 'updated';
    const data = mapCartMutationResponse(cart, { productId, action });
    return successResponse(res, { message: 'Ítem actualizado', data });
  } catch (error) {
    const status = error.statusCode || 400;
    return errorResponse(res, { message: error.message, statusCode: status });
  }
};

const removeItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const cart = await cartService.removeItem(req.user.id, productId);
    const data = mapCartMutationResponse(cart, { productId, action: 'removed' });
    return successResponse(res, { message: 'Ítem eliminado', data });
  } catch (error) {
    const status = error.statusCode || 400;
    return errorResponse(res, { message: error.message, statusCode: status });
  }
};

const clear = async (req, res) => {
  try {
    const cart = await cartService.clearCart(req.user.id);
    const data = {
      cartId: String(cart._id),
      action: 'cleared',
      changedItem: null,
      totals: { lines: 0, items: 0, total: 0 },
    };
    return successResponse(res, { message: 'Carrito vacío', data });
  } catch (error) {
    const status = error.statusCode || 400;
    return errorResponse(res, { message: error.message, statusCode: status });
  }
};

module.exports = { getMyCart, addItem, updateItem, removeItem, clear };
