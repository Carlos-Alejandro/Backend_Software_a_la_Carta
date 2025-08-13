const categoryService = require('../services/category.service');
const { successResponse } = require('../utils/response');
const { HttpError } = require('../utils/httpError');
const sanitizeCategory = require('../helpers/sanitizeCategory');
const asyncHandler = require('../middlewares/asyncHandler');

const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getAllCategories();
  const data = categories.map(sanitizeCategory);
  return successResponse(res, { message: 'Categorías obtenidas', data });
});

const getCategoryById = asyncHandler(async (req, res, next) => {
  const category = await categoryService.getCategoryById(req.params.id);
  if (!category) return next(new HttpError('Categoría no encontrada', 404));
  return successResponse(res, { message: 'Categoría encontrada', data: sanitizeCategory(category) });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body); // << crear en service
  const doc = category?.toObject ? category.toObject() : category; // doc -> POJO si aplica
  return successResponse(res, {
    message: 'Categoría creada',
    data: sanitizeCategory(doc),
    statusCode: 201,
  });
});

const updateCategory = asyncHandler(async (req, res, next) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  if (!category) return next(new HttpError('Categoría no encontrada', 404));
  return successResponse(res, { message: 'Categoría actualizada', data: sanitizeCategory(category) });
});

const deleteCategory = asyncHandler(async (req, res, next) => {
  const deleted = await categoryService.deleteCategory(req.params.id);
  if (!deleted) return next(new HttpError('Categoría no encontrada', 404));
  return successResponse(res, {
    message: 'Categoría eliminada',
    data: { _id: req.params.id },
  });
});

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
