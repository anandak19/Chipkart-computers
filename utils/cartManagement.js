const CartSchema = require('../models/Cart')
const ProductSchema = require('../models/Product')

const getUserCartItems = async(userId) => {
    return await CartSchema.aggregate([
        {
            $match: { userId: userId },
          },
          {
            $unwind: "$products",
          },
          {
            $lookup: {
              from: "products",
              localField: "products.productId",
              foreignField: "_id",
              as: "productDetails",
            },
          },
          {
            $unwind: "$productDetails",
          },
          {
            $project: {
              _id: 1,
              userId: 1,
              "products.productId": 1,
              "products.quantity": 1,
              "products.name": "$productDetails.productName",
              "products.price": "$productDetails.finalPrice",
              "products.image": "$productDetails.images",
              "products.subTotalPrice": {
                $multiply: ["$productDetails.finalPrice", "$products.quantity"]
              }
            },
          }
    ])
}

const getCartTotal = async(userId) => {
  const cart = await getUserCartItems(userId)

  const cartSubTotal = cart.reduce((total, item) => {
    return total + (item.products.subTotalPrice || 0);
  }, 0);

  let shippingFee = 0;
  let cartTotal = 0;

  if (cartSubTotal > 0) {
    shippingFee = cartSubTotal < 5000 ? 100 : 0;
    cartTotal = cartSubTotal + shippingFee;
  }

  return cartTotal
}

const checkProductsAvailability  = async(cart) => {
  return await Promise.all(
    cart.products.map(async (item) => {
      const product = await ProductSchema.findById(item.productId);

      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }
      console.log(item)
      
      if (!product.isListed) {
        throw new Error(`"${product.productName}" is not available`);
      }

      if(product.quantity === 0){
        throw new Error(`"${product.productName}" is out of stock!. Try again after removing it from cart`);
      }

      if(item.quantity > product.quantity){
        throw new Error(`Requsted quantity for the product "${product.productName}" is not available. Try again after decreesing the quantity`);
      }


      return product;
    })
  );
}

module.exports = {getUserCartItems, getCartTotal, checkProductsAvailability}