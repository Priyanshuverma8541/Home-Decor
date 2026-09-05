require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/Product");

const products = [
  { name:"Golden Heart Earrings", category:"earrings", description:"Elegant heart-shaped statement earrings for celebrations and gifting.", price:1299, comparePrice:1599, stock:12, material:"Gold-plated alloy", tags:["gold","heart","gift"], images:["/brand/savitri-jewellers-heart-earrings.png"], isFeatured:true },
  { name:"Sculpted Gold Earrings", category:"earrings", description:"A contemporary handcrafted pair with a polished golden finish.", price:1499, comparePrice:1899, stock:10, material:"Gold-plated alloy", tags:["gold","handcrafted","earrings"], images:["/brand/savitri-jewellers-earrings.png"], isFeatured:true },
  { name:"Signature Celebration Ring", category:"rings", description:"A graceful ring created to mark the moments that matter.", price:1999, stock:8, material:"Gold-plated alloy", tags:["ring","gift","celebration"], images:["/brand/savitri-jewellers-heart-earrings.png"], isFeatured:true },
  { name:"Savitri Bridal Keepsake", category:"bridal", description:"A memorable finishing touch for a special occasion.", price:3499, stock:5, material:"Gold-plated alloy", tags:["bridal","wedding","gold"], images:["/brand/savitri-jewellers-earrings.png"], isFeatured:true },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  for (const product of products) await Product.findOneAndUpdate({ name: product.name }, { ...product, availableCities:["Buxar","Varanasi","Kolkata"], isActive:true }, { upsert:true, new:true, setDefaultsOnInsert:true });
  console.log("Savitri Livings starter products seeded.");
  await mongoose.disconnect();
})().catch((error) => { console.error(error); process.exit(1); });
