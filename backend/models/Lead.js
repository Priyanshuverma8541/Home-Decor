const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  text:      { type: String },
  addedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  addedAt:   { type: Date, default: Date.now },
}, { _id: false });

const leadSchema = new mongoose.Schema({
  name:              { type: String, trim: true },
  phone:             { type: String },
  email:             { type: String },
  city:              { type: String, enum: ["Buxar","Varanasi","Kolkata","Other"] },
  source:            { type: String, enum: ["website","whatsapp","instagram","referral","event","admin"], default: "website" },
  status:            { type: String, enum: ["new","contacted","interested","converted","lost"], default: "new" },

  interestedIn:      [{ type: String }],  // product names or categories
  budget:            { type: String },     // "under 500", "500-2000" etc.

  notes:             [noteSchema],
  tags:              [{ type: String }],   // e.g. "bulk-buyer", "wedding", "repeat"

  lastContactedAt:   { type: Date },
  nextFollowUpAt:    { type: Date },
  assignedTo:        { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  convertedOrderId:  { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  convertedAt:       { type: Date },

  // Auto-linked if they place an order and create an account
  userId:            { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("Lead", leadSchema);
