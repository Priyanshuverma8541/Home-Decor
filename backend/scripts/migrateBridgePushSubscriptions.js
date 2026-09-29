/* One-time migration from Savitri Bridge's separate MongoDB database.
   Keeps actual browser encryption material server-side and never prints it. */
const crypto = require("crypto");
const mongoose = require("mongoose");
require("dotenv").config();

const required = ["MONGO_URI", "BRIDGE_MONGO_URI"];
if (!required.every((key) => process.env[key])) throw new Error("MONGO_URI and BRIDGE_MONGO_URI are required");
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");

(async () => {
  const [source, destination] = await Promise.all([mongoose.createConnection(process.env.BRIDGE_MONGO_URI).asPromise(), mongoose.createConnection(process.env.MONGO_URI).asPromise()]);
  const legacy = await source.collection("pushsubscriptions").find({ status: { $in: ["active", "disabled"] } }, { projection: { endpoint: 1, p256dh: 1, auth: 1, status: 1, createdAt: 1, updatedAt: 1, lastSuccessAt: 1, lastFailureAt: 1 } }).toArray();
  const operations = legacy.filter((item) => item.endpoint && item.p256dh && item.auth).map((item) => ({ updateOne: { filter: { endpointHash: hash(item.endpoint) }, update: { $set: { endpoint: item.endpoint, p256dh: item.p256dh, auth: item.auth, status: item.status === "active" ? "active" : "unsubscribed", lastSuccessAt: item.lastSuccessAt, lastFailureAt: item.lastFailureAt } }, upsert: true } }));
  if (operations.length) await destination.collection("webpushsubscriptions").bulkWrite(operations, { ordered: false });
  console.log(`Migrated ${operations.length} eligible Savitri Bridge browser subscriptions.`);
  await Promise.all([source.close(), destination.close()]);
})().catch(async (error) => { console.error(`Push migration failed: ${error.message}`); await mongoose.disconnect().catch(() => {}); process.exit(1); });
