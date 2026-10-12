const Lead = require("../models/Lead");

exports.getWhatsAppMarketing = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 100 } = req.query;
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 100));
    const filter = { "marketingConsent.granted": true, "marketingConsent.channels": "whatsapp", phone: { $exists: true, $ne: "" } };
    if (String(search).trim()) {
      const escaped = String(search).trim().slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const phoneSearch = String(search).replace(/[^+0-9]/g, "").slice(0, 24);
      filter.$or = [{ name: { $regex: escaped, $options: "i" } }];
      if (phoneSearch) filter.$or.push({ phone: { $regex: phoneSearch } });
    }
    const [contacts, total] = await Promise.all([
      Lead.find(filter).select("name phone email city source interestedIn budget marketingConsent createdAt lastContactedAt").sort({ createdAt: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize).lean(),
      Lead.countDocuments(filter),
    ]);
    res.json({ success: true, contacts, total, page: pageNumber, pages: Math.ceil(total / pageSize) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.addWhatsAppMarketing = async (req, res) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim().slice(0, 120) : "";
    let phone = typeof req.body?.phone === "string" ? req.body.phone.trim().slice(0, 24) : "";
    const consentSource = ["in-person", "whatsapp-chat", "written-message", "website-signup", "other"].includes(req.body?.consentSource) ? req.body.consentSource : "";
    let digits = phone.replace(/\D/g, "");
    if (digits.length === 10) digits = `91${digits}`;
    else if (digits.length === 11 && digits.startsWith("0")) digits = `91${digits.slice(1)}`;
    if (name.length < 2 || !/^[+0-9 ()-]{8,24}$/.test(phone) || digits.length < 10 || digits.length > 15) return res.status(400).json({ success: false, message: "Enter a name and a valid WhatsApp number with country code." });
    if (req.body?.marketingConsent?.granted !== true || req.body?.marketingConsent?.channels?.includes("whatsapp") !== true) return res.status(400).json({ success: false, message: "Confirm this person has agreed to receive promotional WhatsApp messages before adding them." });
    if (!consentSource) return res.status(400).json({ success: false, message: "Choose how the person gave permission so the consent source is recorded." });
    phone = `+${digits}`;
    const alreadyAdded = await Lead.exists({ phone, "marketingConsent.granted": true, "marketingConsent.channels": "whatsapp" });
    if (alreadyAdded) return res.status(409).json({ success: false, message: "This WhatsApp number is already on the consented contact list." });
    const lead = await Lead.create({
      name, phone, city: typeof req.body?.city === "string" ? req.body.city.trim().slice(0, 120) : "",
      source: "admin", status: "interested", tags: ["whatsapp-marketing"],
      contactConsent: { granted: true, grantedAt: new Date(), context: `whatsapp-marketing:${consentSource}` },
      marketingConsent: { granted: true, grantedAt: new Date(), channels: ["whatsapp"], purpose: "Savitri Livings and Savitri Kolkata product and offer updates", version: "2026-10-admin-opt-in" },
      notes: [{ text: `Added to the WhatsApp marketing list after administrator confirmation. Consent source: ${consentSource}.` }],
    });
    res.status(201).json({ success: true, contact: lead });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateWhatsAppConsent = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: "Contact not found." });
    const enabled = req.body?.enabled === true;
    const channels = (lead.marketingConsent?.channels || []).filter((channel) => channel !== "whatsapp");
    if (enabled) channels.push("whatsapp");
    lead.marketingConsent = { ...(lead.marketingConsent?.toObject?.() || lead.marketingConsent || {}), granted: enabled || channels.length > 0, grantedAt: enabled ? new Date() : lead.marketingConsent?.grantedAt, channels };
    lead.notes.push({ text: enabled ? "Administrator re-confirmed WhatsApp promotional consent." : "Removed from WhatsApp promotional messages at administrator request." });
    await lead.save();
    res.json({ success: true, contact: lead });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/leads — admin
exports.getAll = async (req, res) => {
  try {
    const { status, city, source, search, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (city)   filter.city   = city;
    if (source) filter.source = source;
    if (search) filter.$or = [
      { name:  { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
    const skip = (page - 1) * limit;
    const [leads, total] = await Promise.all([
      Lead.find(filter).populate("assignedTo","fullName").populate("convertedOrderId","orderNumber grandTotal").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Lead.countDocuments(filter),
    ]);
    res.json({ success: true, leads, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/leads — create manually (admin or form)
exports.create = async (req, res) => {
  try {
    const body = req.body || {};
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
    const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 24) : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
    if (name.length < 2 || (!phone && !email)) return res.status(400).json({ success: false, message: "Please provide a name and at least one phone number or email address." });
    if (phone && !/^[+0-9 ()-]{8,24}$/.test(phone)) return res.status(400).json({ success: false, message: "Please provide a valid phone number." });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: "Please provide a valid email address." });
    const lead = await Lead.create({
      name,
      phone,
      email,
      city: typeof body.city === "string" ? body.city.trim().slice(0, 120) : "",
      source: ["website", "whatsapp", "instagram", "referral", "event", "admin"].includes(body.source) ? body.source : "website",
      interestedIn: Array.isArray(body.interestedIn) ? body.interestedIn.filter((item) => typeof item === "string").slice(0, 8).map((item) => item.slice(0, 120)) : [],
      budget: typeof body.budget === "string" ? body.budget.slice(0, 80) : "",
      contactConsent: { granted: body.contactConsent?.granted === true, grantedAt: body.contactConsent?.granted === true ? new Date() : undefined, context: String(body.contactConsent?.context || "").slice(0, 100) },
      marketingConsent: {
        granted: body.marketingConsent?.granted === true,
        grantedAt: body.marketingConsent?.granted === true ? new Date() : undefined,
        channels: Array.isArray(body.marketingConsent?.channels) ? [...new Set(body.marketingConsent.channels.filter((channel) => ["whatsapp", "email"].includes(channel)))].slice(0, 2) : [],
        purpose: String(body.marketingConsent?.purpose || "").slice(0, 160),
        version: String(body.marketingConsent?.version || "").slice(0, 40),
      },
      acquisition: {
        source: String(body.acquisition?.source || "").slice(0, 80),
        medium: String(body.acquisition?.medium || "").slice(0, 80),
        campaign: String(body.acquisition?.campaign || "").slice(0, 120),
        referralCode: String(body.acquisition?.referralCode || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80),
      },
      tags: Array.isArray(body.tags) ? body.tags.filter((tag) => typeof tag === "string").slice(0, 12).map((tag) => tag.slice(0, 80)) : [],
      notes: Array.isArray(body.notes) ? body.notes.filter((note) => typeof note?.text === "string").slice(0, 5).map((note) => ({ text: note.text.slice(0, 3000) })) : [],
    });
    res.status(201).json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/leads/:id — update status, add note, assign
exports.update = async (req, res) => {
  try {
    const { status, note, assignedTo, nextFollowUpAt, tags } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    if (status)        lead.status = status;
    if (assignedTo)    lead.assignedTo = assignedTo;
    if (nextFollowUpAt) lead.nextFollowUpAt = nextFollowUpAt;
    if (tags)          lead.tags = tags;
    if (note) {
      lead.notes.push({ text: note, addedBy: req.user._id, addedAt: new Date() });
      lead.lastContactedAt = new Date();
    }
    await lead.save();
    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/leads/:id
exports.remove = async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Lead deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/leads/stats
exports.getStats = async (req, res) => {
  try {
    const pipeline = [{ $group: { _id: "$status", count: { $sum: 1 } } }];
    const byStatus = await Lead.aggregate(pipeline);
    const bySource = await Lead.aggregate([{ $group: { _id: "$source", count: { $sum: 1 } } }]);
    const byCity   = await Lead.aggregate([{ $group: { _id: "$city",   count: { $sum: 1 } } }]);
    const total    = await Lead.countDocuments();
    const today    = new Date(); today.setHours(0,0,0,0);
    const todayNew = await Lead.countDocuments({ createdAt: { $gte: today } });
    res.json({ success: true, total, todayNew, byStatus, bySource, byCity });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
