const mongoose = require("mongoose");

const entertainmentContentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ["music", "video", "playlist"], default: "music" },
  source: { type: String, enum: ["youtube"], default: "youtube" },
  youtubeVideoId: { type: String, required: true, trim: true },
  thumbnail: { type: String, default: "" },
  channelName: { type: String, default: "YouTube" },
  category: { type: String, default: "Bollywood" },
  language: { type: String, default: "Hindi" },
  duration: { type: Number, default: 0 },
  tags: [{ type: String, trim: true }],
  isPublished: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  associatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
}, { timestamps: true });

entertainmentContentSchema.index({ title: "text", tags: "text", category: 1, type: 1 });

module.exports = mongoose.model("EntertainmentContent", entertainmentContentSchema);
