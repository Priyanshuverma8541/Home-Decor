const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Order = require("../models/Order");
const Lead = require("../models/Lead");
const User = require("../models/User");
const MarketplaceListing = require("../models/MarketplaceListing");
const Campaign = require("../models/Campaign");
const Settings = require("../models/Settings");
const { protect, adminOnly } = require("../middleware/auth");

const normalizeOverview = (data) => ({
  ...data,
  products: data.products || [],
  orders: data.orders || [],
  leads: data.leads || [],
  users: data.users || [],
  marketplace: data.marketplace || {},
  campaigns: data.campaigns || [],
  settings: data.settings || {},
});

router.get("/", async (_req, res, next) => {
  try {
    const [products, orders, leads, users, listings, campaigns, settings] = await Promise.all([
      Product.find({ isActive: true }).sort({ createdAt: -1 }).limit(12),
      Order.find().sort({ createdAt: -1 }).limit(8),
      Lead.find().sort({ createdAt: -1 }).limit(8),
      User.find({ isActive: true }).sort({ createdAt: -1 }).limit(8),
      MarketplaceListing.find({ status: "active" }).sort({ createdAt: -1 }).limit(8),
      Campaign.find().sort({ createdAt: -1 }).limit(6),
      Settings.findOne(),
    ]);

    res.json({
      success: true,
      overview: normalizeOverview({
        products,
        orders,
        leads,
        users,
        marketplace: { listings },
        campaigns,
        settings: settings || {},
      }),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/admin", protect, adminOnly, async (_req, res, next) => {
  try {
    const [products, orders, leads, users, listings, campaigns, settings] = await Promise.all([
      Product.find().sort({ createdAt: -1 }).limit(20),
      Order.find().sort({ createdAt: -1 }).limit(20),
      Lead.find().sort({ createdAt: -1 }).limit(20),
      User.find().sort({ createdAt: -1 }).limit(20),
      MarketplaceListing.find().sort({ createdAt: -1 }).limit(20),
      Campaign.find().sort({ createdAt: -1 }).limit(20),
      Settings.findOne(),
    ]);

    res.json({
      success: true,
      overview: normalizeOverview({
        products,
        orders,
        leads,
        users,
        marketplace: { listings },
        campaigns,
        settings: settings || {},
      }),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
