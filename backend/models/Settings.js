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
  instagramHandle:   { type: String, default: "savitrilivings" },

  // Shipping — Pan-India; fields remain for backwards-compatible admin settings.
  activeCities:      { type: [String], default: ["Pan India"] },
  deliveryFee:       {
    type: Map,
    of: Number,
    default: { "Pan India": 0 },
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

  // Permission / capability catalog exposed to the frontend permission center
  permissionCapabilities: {
    type: [
      {
        key: { type: String, required: true },
        label: { type: String, required: true },
        purpose: { type: String, default: "" },
        category: { type: String, default: "browser" },
        enabled: { type: Boolean, default: false },
        status: { type: String, default: "not-granted" },
        available: { type: Boolean, default: true },
      }
    ],
    default: [
      { key: "location", label: "Location / Geolocation", purpose: "Delivery / nearby services", category: "permission", enabled: true, status: "not-granted", available: true },
      { key: "camera", label: "Camera", purpose: "Capture and upload product photos", category: "permission", enabled: true, status: "not-granted", available: true },
      { key: "microphone", label: "Microphone", purpose: "Voice search / voice input", category: "permission", enabled: true, status: "not-granted", available: true },
      { key: "notifications", label: "Browser / Web Push Notifications", purpose: "Order and account alerts", category: "permission", enabled: true, status: "not-granted", available: true },
      { key: "contacts", label: "Contacts, where supported", purpose: "Import customer contact details", category: "permission", enabled: false, status: "not-granted", available: false },
      { key: "files", label: "Photos / File Upload", purpose: "Upload invoices and business documents", category: "permission", enabled: true, status: "not-granted", available: true },
      { key: "clipboard", label: "Clipboard", purpose: "Copy referral links and codes", category: "permission", enabled: true, status: "not-granted", available: true },
      { key: "speech", label: "Speech Recognition", purpose: "Voice-to-text and accessibility support", category: "permission", enabled: false, status: "not-granted", available: false },
      { key: "vibration", label: "Vibration", purpose: "Feedback and haptic confirmation", category: "capability", enabled: true, status: "not-granted", available: true },
      { key: "motion", label: "Device Orientation / Motion Sensors", purpose: "Interactive product experiences and accessibility", category: "capability", enabled: false, status: "not-granted", available: false },
      { key: "bluetooth", label: "Bluetooth", purpose: "Nearby-device pairing for equipment or smart accessories", category: "permission", enabled: false, status: "not-granted", available: false },
      { key: "nfc", label: "NFC", purpose: "Tap-to-connect, quick access or mobile interactions", category: "permission", enabled: false, status: "not-granted", available: false },
      { key: "usb", label: "USB devices", purpose: "Hardware-based file or device transfer", category: "permission", enabled: false, status: "not-granted", available: false },
      { key: "screenShare", label: "Screen sharing / capture", purpose: "Remote-assisted product demos or support", category: "permission", enabled: false, status: "not-granted", available: false },
      { key: "wakeLock", label: "Wake Lock / Keep Screen Awake", purpose: "Keep the checkout or walkthrough screen active", category: "capability", enabled: true, status: "not-granted", available: true },
      { key: "storage", label: "Local Storage", purpose: "Save preferences and session state", category: "capability", enabled: true, status: "granted", available: true },
      { key: "cookies", label: "Cookies", purpose: "Essential site experience and tracking consent", category: "capability", enabled: true, status: "granted", available: true },
      { key: "credentials", label: "Credentials / Passkeys", purpose: "Modern secure sign-in options", category: "permission", enabled: true, status: "not-granted", available: true },
      { key: "webauthn", label: "WebAuthn / device authentication / biometric authentication", purpose: "Secure sign-in and identity verification", category: "permission", enabled: true, status: "not-granted", available: true },
      { key: "calendar", label: "Calendar-related functionality where supported", purpose: "Planning appointments or service scheduling", category: "permission", enabled: false, status: "not-granted", available: false },
      { key: "phone", label: "Phone / tel actions", purpose: "Quick call actions for support and sales", category: "feature", enabled: true, status: "not-granted", available: true },
      { key: "sms", label: "SMS / sms actions", purpose: "One-tap messaging for support and sales", category: "feature", enabled: true, status: "not-granted", available: true },
      { key: "email", label: "Email actions", purpose: "Quick email-based support and outreach", category: "feature", enabled: true, status: "not-granted", available: true },
      { key: "share", label: "Native Web Share", purpose: "Sharing product and referral links", category: "feature", enabled: true, status: "not-granted", available: true },
      { key: "futureCapability", label: "Additional standard browser capability", purpose: "Future-ready support for new browser APIs relevant to Savitri Livings", category: "feature", enabled: false, status: "not-granted", available: false },
    ]
  },
}, { timestamps: true });

module.exports = mongoose.model("Settings", settingsSchema);
