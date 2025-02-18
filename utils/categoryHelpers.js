const Categories = require("../models/Category");

const getCategories = async () => {
    try {
        const categories = await Categories.find({ isListed: true });
        if (!categories.length) {
            throw new Error("No categories found");
        }
        return categories;
    } catch (error) {
        throw error; 
    }
};

module.exports = { getCategories };
