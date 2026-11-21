const mongoose = require("mongoose");

const explorerHRActivitySchema = new mongoose.Schema({
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: "ExplorerHRContact", required: true, index: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true, enum: ["created", "updated", "note", "email", "call", "meeting", "connection", "follow_up"] },
  summary: { type: String, required: true, trim: true, maxlength: 2000 },
  occurredAt: { type: Date, default: Date.now },
  nextFollowUpAt: { type: Date },
}, { timestamps: true, strict: true });

module.exports = mongoose.model("ExplorerHRActivity", explorerHRActivitySchema);
