const mongoose = require('mongoose');
const { Schema } = mongoose; // Destructure Schema from mongoose


// Define a reusable address schema
const addressSchema = {
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    company: { type: String, default: '' },
    country: { type: String, default: '' },
    streetAddress1: { type: String, default: '' },
    streetAddress2: { type: String, default: '' }, // For the optional apartment/suite line
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zip: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
};

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: function() {
      return this.provider === 'local';
    }
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    default: 'local'
  },
  role: {
    type: String,
    default: 'customer'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  displayName: { type: String },
  billingAddress: addressSchema,
  shippingAddress: addressSchema,

  cart: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product' }, // Use destructured Schema
    qty: { type: Number, default: 1, min: 1 }
  }],
  resetPasswordToken: {
    type: String,
    default: undefined,
  },
  resetPasswordExpires: {
    type: Date,
    default: undefined,
  },
  emailVerificationToken: {
    type: String,
    default: undefined,
  },
  emailVerificationExpires: {
    type: Date,
    default: undefined,
  },
}, { timestamps: true });

// Add indexes for performance optimization
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ emailVerified: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ provider: 1 });
userSchema.index({ emailVerificationExpires: 1 }, { sparse: true });
userSchema.index({ resetPasswordExpires: 1 }, { sparse: true });

userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);