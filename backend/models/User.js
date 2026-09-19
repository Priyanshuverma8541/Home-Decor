const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema({
  fullName:          { type: String, required: true, trim: true },
  phone:             { type: String, unique: true, sparse: true },
  email:             { type: String, unique: true, sparse: true, lowercase: true },
  password:          { type: String },
  role:              { type: String, enum: ["customer","admin","delivery","vendor"], default: "customer" },
  city:              { type: String, trim: true, default: "" },
  address:           { type: String },
  instagramHandle:   { type: String },
  whatsapp:          { type: String },
  // Delivery partner fields
  isAvailable:       { type: Boolean, default: true },
  totalDeliveries:   { type: Number,  default: 0 },
  // Vendor fields
  shopName:          { type: String },
  shopDescription:   { type: String },
  commissionRate:    { type: Number, default: 10 }, // percent
  isApproved:        { type: Boolean, default: false },
  isActive:          { type: Boolean, default: true },
  // Marketplace seller profile.  Kept on the existing account so customers do
  // not need a second login when they start selling through Thikana.
  marketplaceStoreName: { type: String, trim: true },
  marketplaceStoreSlug: { type: String, trim: true, lowercase: true, sparse: true, unique: true },
  marketplaceBio:       { type: String, maxlength: 300 },
  marketplaceAvatar:    { type: String },
  marketplaceVerified:  { type: Boolean, default: false },
  // Social
  source:            { type: String, enum: ["website","whatsapp","instagram","referral","direct"], default: "website" },
  notes:             { type: String },
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function (pwd) {
  return bcrypt.compare(pwd, this.password);
};

module.exports = mongoose.model("User", userSchema);
