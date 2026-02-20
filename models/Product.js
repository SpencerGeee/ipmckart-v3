// models/Product.js
const { Schema, model } = require('mongoose');

const productSchema = new Schema({
  slug: { type: String, unique: true, index: true },
  // Category fields captured from Admin UI; we store both for reliability
  category: { type: String, required: true }, // expected to be top-level category id (e.g., 'computing-devices') or name
  subcategory: { type: String, default: '' }, // expected to be subcategory id (e.g., 'laptops') or name

  brand: { type: String, default: '' },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  images: [String],
  description: { type: String, default: '' },
  fullDescription: { type: String, default: '' },
  
  active: { type: Boolean, default: true }, 
  
  careInstructions: String,
  tags: [String],
  isFlashSale: {
        type: Boolean,
        default: false,
        index: true // Add an index for faster querying
    },
    flashSalePrice: {
        type: Number,
        default: null
    },
    flashSaleImage: { // Optional: for a custom promotional image
        type: String,
        default: ''
    },
    flashSaleStock: { // Optional: to limit sale quantity
        type: Number,
        default: 0
    },
  // --- Additional promo flags ---
  isBlackFriday: { type: Boolean, default: false, index: true },
  blackFridayPrice: { type: Number, default: null },
  blackFridayImage: { type: String, default: '' },
  // Christmas promo
  isChristmas: { type: Boolean, default: false, index: true },
  christmasPrice: { type: Number, default: null },
  christmasSaleImage: { type: String, default: '' },
  isBackToSchool: { type: Boolean, default: false, index: true },
  backToSchoolPrice: { type: Number, default: null },
  backToSchoolImage: { type: String, default: '' },
  isNewYear: { type: Boolean, default: false, index: true },
  newYearPrice: { type: Number, default: null },
  newYearImage: { type: String, default: '' },
  isValentines: { type: Boolean, default: false, index: true },
  valentinesPrice: { type: Number, default: null },
  valentinesImage: { type: String, default: '' },
  isComboDeals: { type: Boolean, default: false, index: true },
  comboDealsPrice: { type: Number, default: null },
  comboDealsImage: { type: String, default: '' },
 // Featured/curation flags
 isTopSelling: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// Add compound indexes for performance optimization
productSchema.index({ category: 1, subcategory: 1, active: 1 });
productSchema.index({ isFlashSale: 1, active: 1 });
productSchema.index({ isBlackFriday: 1, active: 1 });
productSchema.index({ isChristmas: 1, active: 1 });
productSchema.index({ isNewYear: 1, active: 1 });
productSchema.index({ isValentines: 1, active: 1 });
productSchema.index({ isBackToSchool: 1, active: 1 });
productSchema.index({ isTopSelling: 1, active: 1 });
productSchema.index({ isComboDeals: 1, active: 1 });
productSchema.index({ price: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ name: 'text', description: 'text' }, { name: 'text_search' });


module.exports = model('Product', productSchema);
