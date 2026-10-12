const mongoose = require("mongoose");
const schema = new mongoose.Schema({ tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true }, fullName: { type: String, required: true, trim: true, maxlength: 120 }, email: { type: String, required: true, trim: true, lowercase: true }, phone: { type: String, trim: true, default: "" }, password: { type: String, required: true, select: false }, modules: { type: [String], default: ["products", "categories", "orders", "enquiries", "homepage", "offers", "analytics", "whatsapp"] }, isActive: { type: Boolean, default: true }, sessionVersion: { type: Number, default: 1 }, lastLoginAt: Date }, { timestamps: true });
schema.index({ tenantId: 1, email: 1 }, { unique: true });
schema.pre("save", async function (next) { if (!this.isModified("password")) return next(); this.password = await require("bcryptjs").hash(this.password, 12); next(); });
schema.methods.matchPassword = function (password) { return require("bcryptjs").compare(password, this.password); };
module.exports = mongoose.model("ClientAdmin", schema);
