const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema({
  name:            { type: String, required: true },
  type:            { type: String, enum: ["whatsapp","instagram","email"], default: "whatsapp" },
  targetCity:      { type: String, enum: ["Buxar","Varanasi","Kolkata","all"], default: "all" },
  targetAudience:  { type: String, enum: ["all","leads","customers","repeat","interested"], default: "all" },
  subject:         { type: String },   // for email
  message:         { type: String, required: true },
  mediaUrl:        { type: String },   // Cloudinary image for WA/IG
  productId:       { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  status:          { type: String, enum: ["draft","scheduled","sending","sent","failed"], default: "draft" },
  scheduledAt:     { type: Date },
  sentAt:          { type: Date },
  sentCount:       { type: Number, default: 0 },
  openCount:       { type: Number, default: 0 },
  clickCount:      { type: Number, default: 0 },
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  recipients:      [{ type: String }], // phone numbers or emails
}, { timestamps: true });

module.exports = mongoose.model("Campaign", campaignSchema);
