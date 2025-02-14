const mongoose = require("mongoose");

const { Schema } = mongoose;

const CategoriesSchema = new Schema(
  {
    categoryName: { type: String, required: true },
    isListed: { type: Boolean, required: true },
    imagePath: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Categories = mongoose.model("categories", CategoriesSchema);

module.exports = Categories
