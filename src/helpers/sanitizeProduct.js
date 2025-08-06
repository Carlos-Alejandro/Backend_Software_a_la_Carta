const sanitizeProduct = (product) => ({
  _id: product._id,
  name: product.name,
  description: product.description,
  categoryId: product.categoryId,
  price: product.price,
  stock: product.stock,
  imageUrl: product.imageUrl,
});

module.exports = sanitizeProduct;
