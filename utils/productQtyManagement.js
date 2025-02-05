const ProductSchema = require("../models/Product");

const increaseProductQuantity = async (productId, session) => {
  return await ProductSchema.findByIdAndUpdate(
    { _id: productId, quantity: {$gt: 0} },
    { $inc: { quantity: 1 }  },
    { new: true, session }
  )
};

const decreaseProductQuantity = async (productId, session) => {
  return await ProductSchema.findOneAndUpdate(
    { _id: productId, quantity: { $gt: 0 } },
    { $inc: { quantity: -1 } },
    { new: true, session }
  );

};

module.exports = { increaseProductQuantity, decreaseProductQuantity };
