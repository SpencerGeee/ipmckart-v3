const mongoose = require('mongoose');
const { Schema } = mongoose;

const accountSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  apiKey: {
    type: String,
    required: true
  },
  baseUrl: {
    type: String,
    default: 'https://api.openai.com/v1'
  },
  quotaLimit: {
    type: Number,
    required: true,
    default: 500000
  },
  quotaUsed: {
    type: Number,
    default: 0
  },
  priority: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsedAt: {
    type: Date
  },
  resetAt: {
    type: Date
  }
}, { timestamps: true });

// Index for rotation selection
accountSchema.index({ isActive: 1, quotaUsed: 1, priority: -1 });

module.exports = mongoose.model('Account', accountSchema);
