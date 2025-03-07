const Order = require("../../models/Order");
const OrderItem = require("../../models/orderItem");

const getReportOverview = async (startDate, endDate) => {
  try {
    const reportAmounts = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            paymentStatus: "Paid",
            isCancelled: false,
          },
        },
        {
          $facet: {
            totalRevenue: [
              {
                $group: {
                  _id: null,
                  total: { $sum: "$totalPayable" }, 
                },
              },
            ],
      
            totalCouponDiscount: [
              {
                $group: {
                  _id: null,
                  couponDiscount: { $sum: "$discount" }, // Summing discount amounts
                },
              },
            ],
      
            totalOrders: [
              {
                $count: "count",
              },
            ],
      
            totalSalesCount: [
              {
                $lookup: {
                  from: "orderitems",
                  localField: "_id",
                  foreignField: "orderId",
                  as: "orderItems",
                },
              },
              { $unwind: "$orderItems" }, // Unwind order items to count each one
              {
                $group: {
                  _id: null,
                  totalProducts: { $sum: "$orderItems.quantity" }, // Sum quantity across all items
                },
              },
            ],
          },
        },
        {
          // Flatten the response to return a clean object
          $project: {
            totalRevenue: { $arrayElemAt: ["$totalRevenue.total", 0] },
            totalCouponDiscount: { $arrayElemAt: ["$totalCouponDiscount.couponDiscount", 0] },
            totalOrders: { $arrayElemAt: ["$totalOrders.count", 0] },
            totalSalesCount: { $arrayElemAt: ["$totalSalesCount.totalProducts", 0] },
          },
        },
      ]);
      

    let reportAmountData = {};
    reportAmountData.totalRevenue =
      reportAmounts[0]?.totalRevenue || 0;
    reportAmountData.totalCouponDiscount =
      reportAmounts[0]?.totalCouponDiscount || 0;
    reportAmountData.totalOrders = reportAmounts[0]?.totalOrders || 0;
    reportAmountData.totalSalesCount = reportAmounts[0]?.totalSalesCount || 0

    // contains - totalRevenue, totalCouponDiscount, totalOrders, totalSalesCount
    
    return reportAmountData;
  } catch (error) {
    console.error("Error fetching report amounts:", error);
    throw new Error("Failed to fetch report amounts");
  }
};


const getAllOrdersDetails = async (startDate, endDate) => {
  try {
    const ordersDetails = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: "Paid",
          isCancelled: false,
        },
      },
      {
        $lookup: {
          from: "orderitems",
          localField: "_id",
          foreignField: "orderId",
          as: "orderItems",
        },
      },
      {
        $addFields: {
          totalProducts: { $sum: "$orderItems.quantity" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $addFields: {
          customerName: "$userDetails.name",
        },
      },
      {
        $project: {
          _id: 1,
          customerName: 1,
          orderStatus: 1,
          paymentMethod: 1,
          totalProducts: 1,
          totalPayable: 1,
          orderId: 1
        },
      },
    ]);

    return ordersDetails;
  } catch (error) {
    console.error("Error fetching orders data:", error);
    throw new Error("Failed to fetch orders details");
  }
};


module.exports = { getReportOverview, getAllOrdersDetails };
