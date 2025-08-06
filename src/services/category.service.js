const Category = require('../models/category.model');

const getAllCategories = async () => {
  return await Category.find().lean();
};

const getCategoryById = async (id) => {
  return await Category.findById(id).lean();
};

const createCategory = async (data) => {
  const category = new Category(data);
  return await category.save();
};

const updateCategory = async (id, data) => {
  return await Category.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

const deleteCategory = async (id) => {
  return await Category.findByIdAndDelete(id);
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
