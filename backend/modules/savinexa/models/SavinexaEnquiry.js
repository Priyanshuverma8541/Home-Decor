const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  phone: { type: String, trim: true, maxlength: 32, default: "" },
  organization: { type: String, trim: true, maxlength: 160, default: "" },
  message: { type: String, required: true, maxlength: 5000 },
  source: { type: String, default: "savinexa-site", maxlength: 80 },
  status: { type: String, enum: ["new", "reviewing", "responded", "closed"], default: "new", index: true },
}, { timestamps: true });
module.exports = mongoose.model("SavinexaEnquiry", schema);
