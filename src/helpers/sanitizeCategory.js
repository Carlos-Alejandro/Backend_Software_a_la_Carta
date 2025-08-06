// src/helpers/sanitizeCategory.js
const sanitizeCategory = (category) => ({
  _id: category._id,
  name: category.name,
  description: category.description,
});

module.exports = sanitizeCategory;
