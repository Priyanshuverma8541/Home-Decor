const Tenant = require("../models/Tenant");

const businesses = [
  { slug: "gangabhog", name: "GangaBhog", website: { tagline: "Pure tradition · Since 1980", heroEyebrow: "GANGA BHOG ATTA", heroTitle: "Har ghar ki sehat. Har din ka saath.", heroDescription: "Premium atta made from Bihar wheat, rooted in Buxar since 1980.", whatsappNumber: "919142666059", phone: "+91 91426 66059", instagramUrl: "https://instagram.com/gangabhog", seoTitle: "GangaBhog Atta · Pure tradition since 1980" }, modules: { products: true, categories: true, orders: true, enquiries: true, homepage: true, offers: true, analytics: true, whatsapp: true } },
  { slug: "savinexa", name: "SaviNexa", website: { tagline: "SaviNexa business workspace", heroEyebrow: "SAVINEXA", heroTitle: "SaviNexa", heroDescription: "Manage SaviNexa business content and enquiries." } },
  { slug: "savitri-kolkata", name: "Savitri Kolkata", website: { tagline: "Savitri Livings Kolkata", heroEyebrow: "SAVITRI KOLKATA", heroTitle: "Savitri Livings Kolkata", heroDescription: "Manage the Kolkata business workspace." } },
  { slug: "maa-vidhyavashini-jewellers", name: "Maa Vidhyavashini Jewellers", website: { tagline: "Jewellery for meaningful moments", heroEyebrow: "MAA VIDHYAVASHINI JEWELLERS", heroTitle: "Tradition, treasured.", heroDescription: "Manage the Maa Vidhyavashini Jewellers workspace.", instagramUrl: "" } },
];

module.exports = async function ensureBusinessTenants() {
  for (const business of businesses) {
    await Tenant.findOneAndUpdate(
      { slug: business.slug },
      { $setOnInsert: { ...business, status: "active", published: false } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
  console.log("✅ Client business workspaces are ready");
};
