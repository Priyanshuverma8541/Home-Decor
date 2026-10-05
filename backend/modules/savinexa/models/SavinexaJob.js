const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  department: { type: String, trim: true, maxlength: 100, default: "" },
  location: { type: String, trim: true, maxlength: 120, default: "" },
  employmentType: { type: String, enum: ["Full-time", "Part-time", "Contract", "Internship"], default: "Full-time" },
  description: { type: String, required: true, maxlength: 12000 },
  requirements: [{ type: String, maxlength: 300 }],
  status: { type: String, enum: ["draft", "published", "closed"], default: "draft", index: true },
  applicationEmail: { type: String, trim: true, lowercase: true, default: "" },
}, { timestamps: true });
module.exports = mongoose.model("SavinexaJob", schema);
