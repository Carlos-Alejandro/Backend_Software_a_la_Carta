const cartService = require('../services/cart.service');
const { successResponse, errorResponse } = require('../utils/response');

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

  const total = items.reduce((acc, it) => acc + it.subtotal, 0);

  return { items, total: Number(total.toFixed(2)) };
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
    return successResponse(res, { message: 'Ítem agregado al carrito', data: mapCartResponse(cart), statusCode: 201 });
  } catch (error) {
    const status = error.statusCode || 400;
    return errorResponse(res, { message: error.message, statusCode: status });
  }
};

const updateItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const cart = await cartService.updateItem(req.user.id, productId, Number(quantity));
    return successResponse(res, { message: 'Ítem actualizado', data: mapCartResponse(cart) });
  } catch (error) {
    const status = error.statusCode || 400;
    return errorResponse(res, { message: error.message, statusCode: status });
  }
};

const removeItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const cart = await cartService.removeItem(req.user.id, productId);
    return successResponse(res, { message: 'Ítem eliminado', data: mapCartResponse(cart) });
  } catch (error) {
    const status = error.statusCode || 400;
    return errorResponse(res, { message: error.message, statusCode: status });
  }
};

const clear = async (req, res) => {
  try {
    await cartService.clearCart(req.user.id);
    return successResponse(res, { message: 'Carrito vacío', data: { items: [], total: 0 } });
  } catch (error) {
    const status = error.statusCode || 400;
    return errorResponse(res, { message: error.message, statusCode: status });
  }
};

module.exports = { getMyCart, addItem, updateItem, removeItem, clear };
