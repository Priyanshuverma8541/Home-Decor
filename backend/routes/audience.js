const router = require("express").Router();
const { protect, adminOnly } = require("../middleware/auth");
const User = require("../models/User");
const Order = require("../models/Order");
const Lead = require("../models/Lead");
const Subscription = require("../models/WebPushSubscription");

const clean = (value) => String(value || "").trim().toLowerCase();
const identityKey = (record) => record.userId ? `user:${record.userId}` : record.email ? `email:${clean(record.email)}` : record.phone ? `phone:${String(record.phone).replace(/\D/g, "")}` : record.id;

router.get("/admin", protect, adminOnly, async (_req, res, next) => {
  try {
    const [users, orders, leads, subscriptions] = await Promise.all([
      User.find({ role: "customer" }).select("fullName email phone city source createdAt").lean(),
      Order.find().select("customerId guestName guestPhone guestCity city grandTotal status createdAt").sort({ createdAt: -1 }).lean(),
      Lead.find().select("name email phone city source status userId createdAt").lean(),
      Subscription.find().select("userId status device createdAt updatedAt").lean(),
    ]);
    const records = new Map();
    const aliases = new Map();
    const ambiguousAliases = new Set();
    const registerAlias = (alias, key) => {
      if (!alias || ambiguousAliases.has(alias)) return;
      const existing = aliases.get(alias);
      if (existing && existing !== key) { aliases.delete(alias); ambiguousAliases.add(alias); }
      else aliases.set(alias, key);
    };
    const upsert = (record) => {
      const emailKey = record.email ? `email:${clean(record.email)}` : "";
      const phoneKey = record.phone ? `phone:${String(record.phone).replace(/\D/g, "")}` : "";
      const key = (record.userId && aliases.get(`user:${record.userId}`)) || (emailKey && aliases.get(emailKey)) || (phoneKey && aliases.get(phoneKey)) || identityKey(record);
      let item = records.get(key);
      if (!item) {
        item = { id: key, name: "", email: "", phone: "", city: "", sources: new Set(), orderCount: 0, lifetimeValue: 0, leadStatuses: new Set(), pushStatus: "not subscribed", pushDevices: [], firstSeen: null, lastOrderAt: null };
        records.set(key, item);
      }
      for (const field of ["name", "email", "phone", "city"]) if (!item[field] && record[field]) item[field] = record[field];
      if (record.source) item.sources.add(record.source);
      if (record.createdAt && (!item.firstSeen || record.createdAt < item.firstSeen)) item.firstSeen = record.createdAt;
      if (record.userId) aliases.set(`user:${record.userId}`, key);
      registerAlias(emailKey, key);
      registerAlias(phoneKey, key);
      return item;
    };
    for (const user of users) upsert({ id: String(user._id), userId: String(user._id), name: user.fullName, email: user.email, phone: user.phone, city: user.city, source: user.source, createdAt: user.createdAt });
    for (const lead of leads) {
      const item = upsert({ id: String(lead._id), userId: lead.userId && String(lead.userId), name: lead.name, email: lead.email, phone: lead.phone, city: lead.city, source: lead.source, createdAt: lead.createdAt });
      item.leadStatuses.add(lead.status);
    }
    for (const order of orders) {
      const item = upsert({ id: String(order._id), userId: order.customerId && String(order.customerId), name: order.guestName, phone: order.guestPhone, city: order.guestCity || order.city });
      item.orderCount += 1;
      item.lifetimeValue += Number(order.grandTotal || 0);
      if (!item.lastOrderAt || order.createdAt > item.lastOrderAt) item.lastOrderAt = order.createdAt;
    }
    for (const sub of subscriptions) {
      const item = upsert({ id: String(sub._id), userId: sub.userId && String(sub.userId) });
      if (sub.status === "active") item.pushStatus = "subscribed";
      else if (item.pushStatus !== "subscribed") item.pushStatus = sub.status;
      if (sub.status === "active" && sub.device) item.pushDevices.push({ browser: sub.device.browser || "", platform: sub.device.platform || "", language: sub.device.language || "" });
    }
    const audience = [...records.values()].map((item) => ({ ...item, sources: [...item.sources], leadStatuses: [...item.leadStatuses], pushDevices: item.pushDevices.slice(0, 5) }));
    res.json({ success: true, contacts: audience, totals: { contacts: audience.length, customers: users.length, leads: leads.length, pushSubscribers: subscriptions.filter((s) => s.status === "active").length } });
  } catch (error) { next(error); }
});

module.exports = router;
