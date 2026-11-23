const router = require("express").Router();
const mongoose = require("mongoose");
const { protect, adminOnly } = require("../middleware/auth");
const SLWallet = require("../models/SLWallet");
const SLWalletTransaction = require("../models/SLWalletTransaction");
const SLWalletWithdrawal = require("../models/SLWalletWithdrawal");
const SLWalletPurchase = require("../models/SLWalletPurchase");
const SLGameSession = require("../models/SLGameSession");

router.use(protect);
const userId = (req) => req.user._id;
const makeBoard = () => {
  const symbols = ["✦", "◇", "☼", "❋", "◈", "✧", "❀", "◎", "☾", "✺", "♢", "✿"];
  return [...symbols, ...symbols].sort(() => Math.random() - 0.5);
};
const ensureWallet = async (id, session) => SLWallet.findOneAndUpdate(
  { userId: id },
  { $setOnInsert: { userId: id, balancePoints: 0, earnedPoints: 0, purchasedPoints: 0, reservedPoints: 0, redeemedPoints: 0 } },
  { new: true, upsert: true, setDefaultsOnInsert: true, ...(session ? { session } : {}) }
);

router.get("/", async (req, res, next) => {
  try {
    const wallet = await ensureWallet(userId(req));
    const [transactions, withdrawals, purchases] = await Promise.all([
      SLWalletTransaction.find({ userId: userId(req) }).sort({ createdAt: -1 }).limit(50).lean(),
      SLWalletWithdrawal.find({ userId: userId(req) }).sort({ createdAt: -1 }).limit(30).lean(),
      SLWalletPurchase.find({ userId: userId(req) }).sort({ createdAt: -1 }).limit(30).lean(),
    ]);
    res.json({ success: true, wallet: { ...wallet.toObject(), availablePoints: Math.max(0, wallet.balancePoints - wallet.reservedPoints), availableEarnedPoints: Math.max(0, wallet.earnedPoints - wallet.reservedPoints - wallet.redeemedPoints) }, transactions, withdrawals, purchases, rules: { rewardPoints: 100, rewardMovesMax: 30, pointsPerRupee: 10, cashoutEnabled: process.env.SL_POINTS_CASHOUT_ENABLED === "true", purchaseUpiId: process.env.SL_POINTS_UPI_ID || "" } });
  } catch (error) { next(error); }
});

router.post("/games/start", async (req, res, next) => {
  try {
    const id = userId(req);
    await ensureWallet(id);
    await SLGameSession.updateMany({ userId: id, status: "active" }, { $set: { status: "abandoned" } });
    const game = await SLGameSession.create({ userId: id, symbols: makeBoard(), expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
    res.status(201).json({ success: true, game: { id: game._id, cards: 24, moves: 0 } });
  } catch (error) { next(error); }
});

router.post("/games/:id/reveal", async (req, res, next) => {
  const mongoSession = await mongoose.startSession();
  try {
    let outcome;
    await mongoSession.withTransaction(async () => {
      const game = await SLGameSession.findOne({ _id: req.params.id, userId: userId(req) }).session(mongoSession);
      if (!game) { outcome = { status: 404, body: { success: false, message: "Game session not found" } }; return; }
      if (game.status !== "active" || game.expiresAt < new Date()) { game.status = "expired"; await game.save({ session: mongoSession }); outcome = { status: 410, body: { success: false, message: "This game session ended. Start a new game." } }; return; }
      const index = Number(req.body?.index);
      if (!Number.isInteger(index) || index < 0 || index >= game.symbols.length || game.matchedIndices.includes(index)) { outcome = { status: 400, body: { success: false, message: "Choose an unrevealed card." } }; return; }
      if (game.openIndex === null) {
        game.openIndex = index;
        await game.save({ session: mongoSession });
        outcome = { status: 200, body: { success: true, symbol: game.symbols[index], matched: false, firstCard: true, moves: game.moves } };
        return;
      }
      if (game.openIndex === index) { outcome = { status: 400, body: { success: false, message: "Choose a different card." } }; return; }
      const firstIndex = game.openIndex;
      const isMatch = game.symbols[firstIndex] === game.symbols[index];
      game.openIndex = null;
      game.moves += 1;
      if (isMatch) game.matchedIndices.push(firstIndex, index);
      const won = game.matchedIndices.length === game.symbols.length;
      game.status = won ? "completed" : "active";
      let rewardGranted = false;
      if (won && game.moves <= 30 && !game.rewardGranted) {
        const wallet = await ensureWallet(userId(req), mongoSession);
        wallet.balancePoints += 100;
        wallet.earnedPoints += 100;
        await wallet.save({ session: mongoSession });
        await SLWalletTransaction.create([{ userId: userId(req), type: "game_reward", pointDelta: 100, rupeeValue: 10, idempotencyKey: "game:" + game._id, referenceId: game._id, note: "Memory Match win within 30 moves" }], { session: mongoSession });
        game.rewardGranted = true;
        rewardGranted = true;
      }
      await game.save({ session: mongoSession });
      outcome = { status: 200, body: { success: true, symbol: game.symbols[index], firstSymbol: game.symbols[firstIndex], matched: isMatch, moves: game.moves, pairsFound: game.matchedIndices.length / 2, won, rewardGranted, earnedPoints: rewardGranted ? 100 : 0, rewardEligible: won && game.moves <= 30 } };
    });
    res.status(outcome?.status || 200).json(outcome?.body || { success: false, message: "Could not update game" });
  } catch (error) { next(error); }
  finally { await mongoSession.endSession(); }
});

router.post("/withdrawals", async (req, res, next) => {
  const mongoSession = await mongoose.startSession();
  try {
    const points = Number(req.body?.points);
    const payoutHandle = String(req.body?.payoutHandle || "").trim().slice(0, 120);
    if (!Number.isInteger(points) || points < 100 || points % 10 !== 0 || !payoutHandle) return res.status(400).json({ success: false, message: "Request at least 100 earned points in 10-point increments and provide a UPI ID." });
    let withdrawal;
    await mongoSession.withTransaction(async () => {
      const wallet = await ensureWallet(userId(req), mongoSession);
      const available = wallet.earnedPoints - wallet.reservedPoints - wallet.redeemedPoints;
      if (available < points) throw Object.assign(new Error("Not enough earned points are available to withdraw."), { status: 400 });
      wallet.reservedPoints += points;
      await wallet.save({ session: mongoSession });
      [withdrawal] = await SLWalletWithdrawal.create([{ userId: userId(req), points, rupees: points / 10, payoutHandle, status: "pending" }], { session: mongoSession });
    });
    res.status(201).json({ success: true, withdrawal, message: "Withdrawal request sent to the Savitri admin team for review." });
  } catch (error) { if (error.status) return res.status(error.status).json({ success: false, message: error.message }); next(error); }
  finally { await mongoSession.endSession(); }
});

router.post("/purchases", async (req, res, next) => {
  try {
    const points = Number(req.body?.points);
    const paymentReference = String(req.body?.paymentReference || "").trim().slice(0, 160);
    if (!process.env.SL_POINTS_UPI_ID) return res.status(503).json({ success: false, message: "SL Points purchases are not configured yet. Contact the Savitri admin team." });
    if (!Number.isInteger(points) || points < 100 || points % 100 !== 0 || paymentReference.length < 6) return res.status(400).json({ success: false, message: "Choose points in 100-point increments and enter the payment reference." });
    const purchase = await SLWalletPurchase.create({ userId: userId(req), points, rupees: points / 10, paymentReference, status: "pending" });
    res.status(201).json({ success: true, purchase, message: "Purchase request submitted. Points are added after admin confirms the payment reference." });
  } catch (error) { next(error); }
});

router.get("/admin/withdrawals", adminOnly, async (_req, res, next) => {
  try { const withdrawals = await SLWalletWithdrawal.find().populate("userId", "fullName email phone").sort({ createdAt: -1 }).limit(500).lean(); res.json({ success: true, withdrawals, cashoutEnabled: process.env.SL_POINTS_CASHOUT_ENABLED === "true" }); }
  catch (error) { next(error); }
});
router.patch("/admin/withdrawals/:id", adminOnly, async (req, res, next) => {
  const mongoSession = await mongoose.startSession();
  try {
    const { status, adminNote, payoutReference } = req.body || {};
    if (!["approved", "rejected", "paid"].includes(status)) return res.status(400).json({ success: false, message: "Choose approve, reject, or mark paid." });
    if (status === "paid" && process.env.SL_POINTS_CASHOUT_ENABLED !== "true") return res.status(403).json({ success: false, message: "Cash payout is disabled. Enable it only after the payout program is approved." });
    let withdrawal;
    await mongoSession.withTransaction(async () => {
      withdrawal = await SLWalletWithdrawal.findById(req.params.id).session(mongoSession);
      if (!withdrawal) throw Object.assign(new Error("Withdrawal request not found"), { status: 404 });
      if (status === "approved" && withdrawal.status !== "pending") throw Object.assign(new Error("Only pending requests can be approved"), { status: 409 });
      if (status === "rejected" && !["pending", "approved"].includes(withdrawal.status)) throw Object.assign(new Error("This request can no longer be rejected"), { status: 409 });
      if (status === "paid" && withdrawal.status !== "approved") throw Object.assign(new Error("Approve the request before marking it paid"), { status: 409 });
      if (status === "rejected" || status === "paid") {
        const wallet = await ensureWallet(withdrawal.userId, mongoSession);
        wallet.reservedPoints = Math.max(0, wallet.reservedPoints - withdrawal.points);
        if (status === "paid") {
          wallet.balancePoints = Math.max(0, wallet.balancePoints - withdrawal.points);
          wallet.earnedPoints = Math.max(0, wallet.earnedPoints - withdrawal.points);
          wallet.redeemedPoints += withdrawal.points;
          await SLWalletTransaction.create([{ userId: withdrawal.userId, type: "withdrawal_paid", pointDelta: -withdrawal.points, rupeeValue: withdrawal.rupees, idempotencyKey: "withdrawal:" + withdrawal._id, referenceId: withdrawal._id, note: String(payoutReference || "").slice(0, 500) }], { session: mongoSession });
        }
        await wallet.save({ session: mongoSession });
      }
      withdrawal.status = status;
      withdrawal.adminNote = String(adminNote || "").slice(0, 1000);
      withdrawal.payoutReference = String(payoutReference || "").slice(0, 160);
      withdrawal.reviewedBy = req.user._id;
      withdrawal.reviewedAt = new Date();
      await withdrawal.save({ session: mongoSession });
    });
    res.json({ success: true, withdrawal });
  } catch (error) { if (error.status) return res.status(error.status).json({ success: false, message: error.message }); next(error); }
  finally { await mongoSession.endSession(); }
});

router.get("/admin/purchases", adminOnly, async (_req, res, next) => {
  try { const purchases = await SLWalletPurchase.find().populate("userId", "fullName email phone").sort({ createdAt: -1 }).limit(500).lean(); res.json({ success: true, purchases }); }
  catch (error) { next(error); }
});
router.patch("/admin/purchases/:id", adminOnly, async (req, res, next) => {
  const mongoSession = await mongoose.startSession();
  try {
    const { status, adminNote } = req.body || {};
    if (!["paid", "rejected"].includes(status)) return res.status(400).json({ success: false, message: "Choose confirm payment or reject." });
    let purchase;
    await mongoSession.withTransaction(async () => {
      purchase = await SLWalletPurchase.findById(req.params.id).session(mongoSession);
      if (!purchase) throw Object.assign(new Error("Points purchase request not found"), { status: 404 });
      if (purchase.status !== "pending") throw Object.assign(new Error("This purchase has already been reviewed"), { status: 409 });
      if (status === "paid") {
        const wallet = await ensureWallet(purchase.userId, mongoSession);
        wallet.balancePoints += purchase.points;
        wallet.purchasedPoints += purchase.points;
        await wallet.save({ session: mongoSession });
        await SLWalletTransaction.create([{ userId: purchase.userId, type: "purchase", pointDelta: purchase.points, rupeeValue: purchase.rupees, idempotencyKey: "purchase:" + purchase._id, referenceId: purchase._id, note: "Admin-confirmed UPI payment" }], { session: mongoSession });
      }
      purchase.status = status;
      purchase.adminNote = String(adminNote || "").slice(0, 1000);
      purchase.reviewedBy = req.user._id;
      purchase.reviewedAt = new Date();
      await purchase.save({ session: mongoSession });
    });
    res.json({ success: true, purchase });
  } catch (error) { if (error.status) return res.status(error.status).json({ success: false, message: error.message }); next(error); }
  finally { await mongoSession.endSession(); }
});

module.exports = router;
