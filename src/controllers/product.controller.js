const productService = require('../services/product.service');
const { successResponse, errorResponse } = require('../utils/response');
const sanitizeProduct = require('../helpers/sanitizeProduct');

const getAllProducts = async (req, res) => {
  try {
    const products = await productService.getAllProducts();
    const sanitized = products.map(p => sanitizeProduct(p));
    successResponse(res, { message: 'Productos obtenidos', data: sanitized });
  } catch (error) {
    errorResponse(res, { message: 'Error al obtener productos', error });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      return errorResponse(res, { message: 'Producto no encontrado', statusCode: 404 });
    }
    successResponse(res, { message: 'Producto encontrado', data: sanitizeProduct(product) });
  } catch (error) {
    errorResponse(res, { message: 'Error al buscar producto', error });
  }
};

const partialUpdateProduct = async (req, res) => {
  try {
    const updated = await productService.partialUpdateProduct(req.params.id, req.body);
    if (!updated) return errorResponse(res, { message: 'Producto no encontrado', statusCode: 404 });
    successResponse(res, { message: 'Producto modificado parcialmente', data: sanitizeProduct(updated) });
  } catch (error) {
    errorResponse(res, { message: 'Error al modificar producto', error });
  }
};

const createProduct = async (req, res) => {
  try {
    const product = await productService.createProduct(req.body);
    successResponse(res, {
      message: 'Producto creado',
      data: sanitizeProduct(product),
      statusCode: 201,
    });
  } catch (error) {
    errorResponse(res, { message: 'Error al crear producto', error });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    if (!product) {
      return errorResponse(res, { message: 'Producto no encontrado', statusCode: 404 });
    }
    successResponse(res, { message: 'Producto actualizado', data: sanitizeProduct(product) });
  } catch (error) {
    errorResponse(res, { message: 'Error al actualizar producto', error });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const deleted = await productService.deleteProduct(req.params.id);
    if (!deleted) {
      return errorResponse(res, { message: 'Producto no encontrado', statusCode: 404 });
    }
    // ✅ incluye data para contrato uniforme
    return successResponse(res, {
      message: 'Producto eliminado',
      data: { _id: req.params.id },
    });
  } catch (error) {
    return errorResponse(res, { message: 'Error al eliminar producto', error });
  }
};


module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  partialUpdateProduct,
  deleteProduct,
};
