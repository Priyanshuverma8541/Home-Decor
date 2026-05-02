const Settings  = require("../models/Settings");
const { cloudinary } = require("../config/cloudinary");

// GET /api/settings — public (for frontend)
exports.getPublic = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    const { upiId, qrImageUrl, brandName, tagline, contactPhone, whatsappNumber, instagramHandle, activeCities, deliveryFee, freeDeliveryAbove, deliverySlots, maintenanceMode, maintenanceMsg, announcementText, showAnnouncement, facebookUrl, youtubeUrl } = settings;
    res.json({ success: true, settings: { upiId, qrImageUrl, brandName, tagline, contactPhone, whatsappNumber, instagramHandle, activeCities, deliveryFee, freeDeliveryAbove, deliverySlots, maintenanceMode, maintenanceMsg, announcementText, showAnnouncement, facebookUrl, youtubeUrl } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/settings/admin — full settings (admin only)
exports.getAdmin = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/settings — update (admin only)
exports.update = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();
    Object.assign(settings, req.body);
    await settings.save();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/settings/qr — upload new QR image (admin)
exports.uploadQR = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();
    // Delete old QR from Cloudinary if exists
    if (settings.qrImageUrl) {
      const publicId = settings.qrImageUrl.split("/").slice(-2).join("/").split(".")[0];
      await cloudinary.uploader.destroy(publicId).catch(() => {});
    }
    settings.qrImageUrl = req.file.path;
    settings.upiId      = req.body.upiId || settings.upiId;
    await settings.save();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
