const Order = require("../../models/Order");
const OrderItem = require("../../models/orderItem");
const { STATUS_CODES } = require("../constants");
const CustomError = require("../customError");

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
          totalCouponDiscount: {
            $arrayElemAt: ["$totalCouponDiscount.couponDiscount", 0],
          },
          totalOrders: { $arrayElemAt: ["$totalOrders.count", 0] },
          totalSalesCount: {
            $arrayElemAt: ["$totalSalesCount.totalProducts", 0],
          },
        },
      },
    ]);

    let reportAmountData = {};
    reportAmountData.totalRevenue = reportAmounts[0]?.totalRevenue || 0;
    reportAmountData.totalCouponDiscount =
      reportAmounts[0]?.totalCouponDiscount || 0;
    reportAmountData.totalOrders = reportAmounts[0]?.totalOrders || 0;
    reportAmountData.totalSalesCount = reportAmounts[0]?.totalSalesCount || 0;

    // contains - totalRevenue, totalCouponDiscount, totalOrders, totalSalesCount

    return reportAmountData;
  } catch (error) {
    throw new CustomError("Failed to fetch report amounts", STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
};


const getAllOrdersDetails = async (
  startDate,
  endDate,
  page = 0,
  paginated = false
) => {
  try {
    const pageNum = Number(page) || 0;
    const limit = 5;
    const skip = pageNum * limit;

    const pipeline = [
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
        $sort: { createdAt: -1 },
      },
      {
        $project: {
          _id: 1,
          customerName: 1,
          orderStatus: 1,
          paymentMethod: 1,
          totalProducts: 1,
          totalPayable: 1,
          orderId: 1,
        },
      },
    ];

    if (paginated) {
      pipeline.push({
        $facet: {
          paginatedResult: [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: "totalOrders" }],
        },
      });
    }

    const ordersDetails = await Order.aggregate(pipeline);

    return ordersDetails;
  } catch (error) {
    throw new CustomError("Failed to fetch orders details", STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
};

module.exports = { getReportOverview, getAllOrdersDetails };
