const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const Project = require("../modules/buildhub/models/Project");
const Order = require("../modules/buildhub/models/Order");
const Lead = require("../modules/buildhub/models/Lead");
const Settings = require("../modules/buildhub/models/Settings");

async function copyCollection(source, target, transform = (document) => document, identity = (document) => ({ _id: document._id })) {
  const documents = await source.find({}).lean();
  if (!documents.length) return 0;
  let inserted = 0;
  for (const document of documents) {
    if (await target.findOne(identity(document), { projection: { _id: 1 } })) continue;
    await target.updateOne({ _id: document._id }, { $setOnInsert: transform(document) }, { upsert: true });
    inserted += 1;
  }
  return inserted;
}

(async () => {
  const sourceUri = process.env.BUILDHUB_MONGO_URI;
  const targetUri = process.env.MONGO_URI;
  if (!sourceUri || !targetUri) throw new Error("Set BUILDHUB_MONGO_URI (legacy BuildHub database) and MONGO_URI (Savitri Livings database) before running this one-time import.");
  if (sourceUri === targetUri) throw new Error("Source and target database URIs must be different.");
  const source = await mongoose.createConnection(sourceUri).asPromise();
  await mongoose.connect(targetUri);
  try {
    const projects = await copyCollection(source.collection("projects"), Project.collection, (document) => document, (document) => ({ $or: [{ _id: document._id }, { slug: document.slug }] }));
    const orders = await copyCollection(source.collection("orders"), Order.collection, (document) => document, (document) => ({ $or: [{ _id: document._id }, { orderNumber: document.orderNumber }] }));
    const leads = await copyCollection(source.collection("leads"), Lead.collection);
    const settings = await copyCollection(source.collection("settings"), Settings.collection, (document) => ({ ...document, key: "buildhub" }), () => ({ key: "buildhub" }));
    console.log(JSON.stringify({ projects, orders, leads, settings, mode: "insert-missing identities; existing Savitri records preserved" }, null, 2));
  } finally {
    await source.close();
    await mongoose.disconnect();
  }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
