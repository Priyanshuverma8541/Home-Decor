require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../models/MarketplaceCategory");

const categories = [
  ["Jewellery & Accessories", "💎", ["Gold Jewellery", "Silver Jewellery", "Fashion Accessories"]],
  ["Home & Living", "🏠", ["Furniture", "Home Decor", "Appliances"]],
  ["Fashion", "👗", ["Clothing", "Footwear", "Bags"]],
  ["Services", "🛠️", ["Repairs", "Events", "Professional Services"]],
  ["Jobs & Opportunities", "💼", ["Hiring", "Freelance", "Internships"]],
  ["Community", "🤝", ["Events", "Classes", "Recommendations"]],
];
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  for (const [name, icon, subs] of categories) {
    await Category.findOneAndUpdate({ slug: slug(name) }, {
      name, slug: slug(name), icon, isActive: true,
      subcategories: subs.map((sub) => ({ name: sub, slug: slug(sub), attributes: [] })),
    }, { upsert: true, new: true });
  }
  console.log("Marketplace categories seeded.");
  await mongoose.disconnect();
})().catch((error) => { console.error(error); process.exit(1); });
