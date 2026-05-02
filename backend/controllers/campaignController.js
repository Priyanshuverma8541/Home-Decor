const Campaign = require("../models/Campaign");
const Lead     = require("../models/Lead");
const User     = require("../models/User");

exports.getAll = async (req, res) => {
  try {
    const campaigns = await Campaign.find().populate("createdBy","fullName").sort({ createdAt: -1 });
    res.json({ success: true, campaigns });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const mediaUrl = req.file?.path || req.body.mediaUrl;
    const campaign = await Campaign.create({ ...req.body, mediaUrl, createdBy: req.user._id });
    res.status(201).json({ success: true, campaign });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.mediaUrl = req.file.path;
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });
    res.json({ success: true, campaign });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/campaigns/:id/send — build recipient list + mark sent
exports.send = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });

    // Build recipient list
    let phones = [];
    const cityFilter = campaign.targetCity !== "all" ? { city: campaign.targetCity } : {};

    if (campaign.targetAudience === "leads" || campaign.targetAudience === "interested") {
      const leads = await Lead.find({ ...cityFilter, phone: { $exists: true, $ne: "" } });
      phones = leads.map(l => l.phone).filter(Boolean);
    } else {
      const users = await User.find({ ...cityFilter, role: "customer", phone: { $exists: true, $ne: "" } });
      phones = users.map(u => u.phone).filter(Boolean);
    }

    // Remove duplicates
    phones = [...new Set(phones)];

    campaign.recipients  = phones;
    campaign.sentCount   = phones.length;
    campaign.status      = "sent";
    campaign.sentAt      = new Date();
    await campaign.save();

    // Generate WhatsApp broadcast link (for manual send via WA Business)
    const waLink = `https://wa.me/?text=${encodeURIComponent(campaign.message)}`;

    res.json({ success: true, campaign, recipientCount: phones.length, phones, waLink });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Campaign deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
