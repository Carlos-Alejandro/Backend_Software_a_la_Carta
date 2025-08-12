const Product = require('../models/product.model');

const getAllProducts = async () => {
  return await Product.find().populate('categoryId', 'name').lean();
};

const getProductById = async (id) => {
  return await Product.findById(id).populate('categoryId', 'name').lean();
};

const createProduct = async (data) => {
  const product = new Product(data);
  return await product.save();
};

const updateProduct = async (id, data) => {
  return await Product.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

const deleteProduct = async (id) => {
  return await Product.findByIdAndDelete(id);
};

const partialUpdateProduct = async (id, fieldsToUpdate) => {
  return await Product.findByIdAndUpdate(id, fieldsToUpdate, { new: true });
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  partialUpdateProduct,
  deleteProduct,
};
