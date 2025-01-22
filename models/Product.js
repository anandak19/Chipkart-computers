const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    categoryId: { type: String, required: true },
    brand: { type: String, required: true },
    mrp: { type: mongoose.Types.Decimal128, required: true },
    discount: { type: Number, required: true, min: 0, max: 100 },
    finalPrice: { type: mongoose.Types.Decimal128, required: true },
    quantity: { type: Number, required: true, min: 0 },
    isFeatured:  { type: Boolean, required: true, default: false },
    highlights: { type: [String], required: true },
    description: { type: String, required: true, maxlength: 500 },
    isListed: { type: Boolean, required: true, default: true},
    images: [{
        filename: { type: String, required: true },
        filepath: { type: String, required: true }
    }]
}, {timestamps: true});

const Product = mongoose.model('Product', productSchema);

module.exports = Product
