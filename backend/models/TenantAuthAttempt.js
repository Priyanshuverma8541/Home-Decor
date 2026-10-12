const mongoose = require("mongoose");
const schema = new mongoose.Schema({ key: { type: String, unique: true, required: true }, expiresAt: { type: Date, required: true, index: { expires: 0 } }, attempts: { type: Number, default: 0 } }, { timestamps: true });
module.exports = mongoose.model("TenantAuthAttempt", schema);
