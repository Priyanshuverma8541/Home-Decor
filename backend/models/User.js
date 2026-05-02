// const mongoose = require("mongoose");
// const bcrypt   = require("bcryptjs");

// const userSchema = new mongoose.Schema({
//   fullName:          { type: String, required: true, trim: true },
//   phone:             { type: String, unique: true, sparse: true },
//   email:             { type: String, unique: true, sparse: true, lowercase: true },
//   password:          { type: String },
//   role:              { type: String, enum: ["customer","admin","delivery","vendor"], default: "customer" },
//   city:              { type: String, enum: ["Buxar","Varanasi","Kolkata","Other"], default: "Buxar" },
//   address:           { type: String },
//   instagramHandle:   { type: String },
//   whatsapp:          { type: String },
//   // Delivery partner fields
//   isAvailable:       { type: Boolean, default: true },
//   totalDeliveries:   { type: Number,  default: 0 },
//   // Vendor fields
//   shopName:          { type: String },
//   shopDescription:   { type: String },
//   commissionRate:    { type: Number, default: 10 }, // percent
//   isApproved:        { type: Boolean, default: false },
//   isActive:          { type: Boolean, default: true },
//   // Social
//   source:            { type: String, enum: ["website","whatsapp","instagram","referral","direct"], default: "website" },
//   notes:             { type: String },
// }, { timestamps: true });

// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password") || !this.password) return next();
//   this.password = await bcrypt.hash(this.password, 12);
//   next();
// });

// userSchema.methods.matchPassword = function (pwd) {
//   return bcrypt.compare(pwd, this.password);
// };

// module.exports = mongoose.model("User", userSchema);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },

  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    default: undefined
  },

  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    default: undefined
  },

  password: { type: String },

  role: {
    type: String,
    enum: ["customer", "admin", "delivery", "vendor"],
    default: "customer"
  },

  city: {
    type: String,
    enum: ["Buxar", "Varanasi", "Kolkata", "Other"],
    default: "Buxar"
  },

  address: String,
  instagramHandle: String,
  whatsapp: String,

  isAvailable: { type: Boolean, default: true },
  totalDeliveries: { type: Number, default: 0 },

  shopName: String,
  shopDescription: String,
  commissionRate: { type: Number, default: 10 },

  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  source: {
    type: String,
    enum: ["website", "whatsapp", "instagram", "referral", "direct"],
    default: "website"
  },

  notes: String

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