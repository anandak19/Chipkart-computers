const ProductSchema = require("../models/Product");

const increaseProductQuantity = async (productId) => {
  const product = await ProductSchema.findByIdAndUpdate(
    productId,
    { $inc: { quantity: 1 } },
    { new: true }
  );

  if (!product) throw new Error("Failed to find the product");

  return product;
};

const decreaseProductQuantity = async (productId, session) => {
  return await ProductSchema.findOneAndUpdate(
    { _id: productId, quantity: { $gt: 0 } },
    { $inc: { quantity: -1 } },
    { new: true, session }
  );

};

module.exports = { increaseProductQuantity, decreaseProductQuantity };
