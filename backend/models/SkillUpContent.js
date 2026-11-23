const mongoose = require("mongoose");

const skillUpContentSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ["blog", "learning", "ai_builder", "agent", "productivity"], index: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 220 },
  excerpt: { type: String, trim: true, maxlength: 500 },
  body: { type: String, trim: true, maxlength: 30000 },
  href: { type: String, trim: true, maxlength: 800 },
  category: { type: String, trim: true, maxlength: 100 },
  tags: [{ type: String, trim: true, maxlength: 60 }],
  status: { type: String, enum: ["draft", "pending", "published", "rejected", "archived"], default: "draft", index: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  authorName: { type: String, trim: true, maxlength: 140 },
  moderationNote: { type: String, trim: true, maxlength: 1000 },
  publishedAt: { type: Date },
}, { timestamps: true });

skillUpContentSchema.index({ type: 1, status: 1, publishedAt: -1 });
module.exports = mongoose.model("SkillUpContent", skillUpContentSchema);
