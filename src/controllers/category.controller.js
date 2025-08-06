const categoryService = require('../services/category.service');
const { successResponse, errorResponse } = require('../utils/response');
const sanitizeCategory = require('../helpers/sanitizeCategory');

const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories();
    const sanitized = categories.map(c => sanitizeCategory(c));
    successResponse(res, { message: 'Categorías obtenidas', data: sanitized });
  } catch (error) {
    errorResponse(res, { message: 'Error al obtener categorías', error });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    if (!category) {
      return errorResponse(res, { message: 'Categoría no encontrada', statusCode: 404 });
    }
    successResponse(res, { message: 'Categoría encontrada', data: sanitizeCategory(category) });
  } catch (error) {
    errorResponse(res, { message: 'Error al buscar categoría', error });
  }
};

const createCategory = async (req, res) => {
  try {
    const category = await categoryService.createCategory(req.body);
    successResponse(res, {
      message: 'Categoría creada',
      data: sanitizeCategory(category),
      statusCode: 201,
    });
  } catch (error) {
    errorResponse(res, { message: 'Error al crear categoría', error });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    if (!category) {
      return errorResponse(res, { message: 'Categoría no encontrada', statusCode: 404 });
    }
    successResponse(res, { message: 'Categoría actualizada', data: sanitizeCategory(category) });
  } catch (error) {
    errorResponse(res, { message: 'Error al actualizar categoría', error });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const deleted = await categoryService.deleteCategory(req.params.id);
    if (!deleted) {
      return errorResponse(res, { message: 'Categoría no encontrada', statusCode: 404 });
    }
    successResponse(res, { message: 'Categoría eliminada' });
  } catch (error) {
    errorResponse(res, { message: 'Error al eliminar categoría', error });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
