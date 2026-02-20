// models/RefreshToken.js
const mongoose = require('mongoose')
const { Schema } = mongoose

const RefreshTokenSchema = new Schema({
  token:    { type: String, required: true, index: true },
  user:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  expires:  { type: Date, required: true },
  revoked:  { type: Boolean, default: false }
}, { timestamps: true })

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema)
