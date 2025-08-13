const productService = require('../services/product.service');
const { successResponse } = require('../utils/response');
const { HttpError } = require('../utils/httpError');
const sanitizeProduct = require('../helpers/sanitizeProduct');
const asyncHandler = require('../middlewares/asyncHandler');

const getAllProducts = asyncHandler(async (req, res) => {
  const products = await productService.getAllProducts();
  const data = products.map(sanitizeProduct);
  return successResponse(res, { message: 'Productos obtenidos', data });
});

const getProductById = asyncHandler(async (req, res, next) => {
  const product = await productService.getProductById(req.params.id);
  if (!product) return next(new HttpError('Producto no encontrado', 404));
  return successResponse(res, { message: 'Producto encontrado', data: sanitizeProduct(product) });
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body); // << crear en service
  const doc = product?.toObject ? product.toObject() : product; // por si viene como doc de Mongoose
  return successResponse(res, {
    message: 'Producto creado',
    data: sanitizeProduct(doc),
    statusCode: 201,
  });
});

const updateProduct = asyncHandler(async (req, res, next) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  if (!product) return next(new HttpError('Producto no encontrado', 404));
  return successResponse(res, { message: 'Producto actualizado', data: sanitizeProduct(product) });
});

const partialUpdateProduct = asyncHandler(async (req, res, next) => {
  const updated = await productService.partialUpdateProduct(req.params.id, req.body);
  if (!updated) return next(new HttpError('Producto no encontrado', 404));
  return successResponse(res, { message: 'Producto modificado parcialmente', data: sanitizeProduct(updated) });
});

const deleteProduct = asyncHandler(async (req, res, next) => {
  const deleted = await productService.deleteProduct(req.params.id);
  if (!deleted) return next(new HttpError('Producto no encontrado', 404));
  return successResponse(res, {
    message: 'Producto eliminado',
    data: { _id: req.params.id },
  });
});

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  partialUpdateProduct,
  deleteProduct,
};
