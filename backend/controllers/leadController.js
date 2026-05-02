const Lead = require("../models/Lead");

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
    const lead = await Lead.create(req.body);
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
