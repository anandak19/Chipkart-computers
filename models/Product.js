const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    categoryId: { type: String, required: true },
    brand: { type: String, required: true },
    mrp: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    offerStartDate: { type: Date, required: true },
    offerEndDate: { type: Date, required: true },
    quantity: { type: Number, required: true, min: 0 },
    isFeatured:  { type: Boolean, required: true, default: false },
    highlights: { type: [String], required: true },
    description: { type: String, required: true, maxlength: 500 },
    isListed: { type: Boolean, required: true, default: true},
    images: [{
        filename: { type: String, default: null },
        filepath: { type: String, default: null },
        position: { type: Number, required: true },
    }]
}, {timestamps: true});

const Product = mongoose.model('Product', productSchema);

module.exports = Product
