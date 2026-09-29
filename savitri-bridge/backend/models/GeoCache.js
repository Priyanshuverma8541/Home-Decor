'use strict';
const mongoose = require('mongoose');

const geoCacheSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // coordinates rounded to ~110m
  result: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 }
});
module.exports = mongoose.model('GeoCache', geoCacheSchema);
