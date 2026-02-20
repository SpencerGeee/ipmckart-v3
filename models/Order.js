// models/Order.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrderItemSchema = new Schema({
  // Allow either ObjectId (real products) or String/slug (synthetic test products)
  productId: { type: Schema.Types.Mixed, required: true },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  price: { type: Number, required: true }, // captured at order time
  qty: { type: Number, required: true, min: 1, max: 999 },
  lineTotal: { type: Number, required: true },
  custom: {
    color: { type: String, default: '' },
    size: { type: String, default: '' },
    design: { type: String, default: '' }
  }
}, { _id: false });

const AddressSchema = new Schema({  // Renamed for clarity (used for both billing and shipping)
  name: String,
  email: String,
  companyName: String,
  country: String,
  streetAddress: String,
  streetAddress2: String,
  town: String,
  state: String,
  zipCode: String,
  phone: String,
  notes: String
}, { _id: false });

const OrderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  items: { type: [OrderItemSchema], required: true },
  billing: { type: AddressSchema, required: true },
  shipping: { type: AddressSchema, default: null },  // New: Separate shipping address
  subtotal: { type: Number, required: true },
  shippingCost: { type: Number, default: 0 },  // New
  total: { type: Number, required: true },  // New
  currency: { type: String, default: 'GHS' },
  status: { type: String, enum: ['placed', 'processing', 'paid', 'failed', 'shipped', 'delivered', 'cancelled', 'refunded'], default: 'placed' },
  gateway: { type: String, default: 'none' },
  gatewayRef: { type: String, default: '' },
  shippingMethod: { type: String, enum: ['standard', 'express'], default: 'standard' },
  paymentMethod: { type: String, default: 'cod' }  // New
}, { timestamps: true });

// Add indexes for performance optimization
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'billing.email': 1 }, { name: 'billing_email_index' });
OrderSchema.index({ gatewayRef: 1 }, { unique: true, sparse: true });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ total: -1 });

module.exports = mongoose.model('Order', OrderSchema);
