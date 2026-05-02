const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  // Payment — editable from admin
  upiId:             { type: String, default: "6207855397@ybl" },
  qrImageUrl:        { type: String, default: "" },
  razorpayKeyId:     { type: String, default: "" },

  // Business identity
  brandName:         { type: String, default: "Savitri Livings" },
  tagline:           { type: String, default: "Handcrafted beauty, delivered to your door" },
  contactEmail:      { type: String, default: "" },
  contactPhone:      { type: String, default: "6207855397" },
  whatsappNumber:    { type: String, default: "6207855397" },
  instagramHandle:   { type: String, default: "livingcrafts__" },

  // Cities
  activeCities:      { type: [String], default: ["Buxar"] },
  deliveryFee:       {
    type: Map,
    of: Number,
    default: { Buxar: 30, Varanasi: 50, Kolkata: 60 },
  },
  freeDeliveryAbove: { type: Number, default: 500 },

  // Delivery time slots (per city)
  deliverySlots:     { type: [String], default: ["10am-1pm","2pm-5pm","6pm-9pm"] },

  // Maintenance
  maintenanceMode:   { type: Boolean, default: false },
  maintenanceMsg:    { type: String,  default: "We are updating the website. Back soon!" },

  // WhatsApp order template
  waOrderTemplate:   { type: String, default: "Hi Savitri Livings! I want to order: {productName} x{qty}. My address: {address}, {city}. Please confirm." },

  // Social links
  facebookUrl:       { type: String, default: "" },
  youtubeUrl:        { type: String, default: "" },

  // Announcement banner
  announcementText:  { type: String, default: "" },
  showAnnouncement:  { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Settings", settingsSchema);
