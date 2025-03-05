

const validateOffer = (req, res, next) => {
  try {
    const { offerTitle, discount, offerTarget, startDate, endDate } =
      req.body;

    if (!offerTitle || offerTitle.trim().length < 5) {
      return res
        .status(400)
        .json({ error: "Offer title must be at least 5 characters long." });
    }

    if (discount === undefined || discount < 0 || discount > 100) {
      return res
        .status(400)
        .json({ error: "Discount must be between 0 and 100." });
    }


    if (!["product", "category"].includes(offerTarget)) {
      return res
        .status(400)
        .json({ error: "Offer target should be 'category' or 'product'" });
    }

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required." });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid date format. Use 'YYYY-MM-DD'." });
    }

    if (start >= end) {
      return res.status(400).json({ error: "Start date must be earlier than end date." });
    }

    if (end < now.setHours(0, 0, 0, 0)) {
      return res.status(400).json({ error: "End date must be in the future." });
    }

    next();
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = { validateOffer };
