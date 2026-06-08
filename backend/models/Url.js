const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  ip: String,
  device: String,
  browser: String,
});

const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortCode:   { type: String, required: true, unique: true },
  alias:       { type: String, default: null },   // custom alias
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  clicks:      { type: Number, default: 0 },
  clickData:   [clickSchema],
  expiresAt:   { type: Date, default: null },
  createdAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('Url', urlSchema);
