const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const cors       = require("cors");
const dotenv     = require("dotenv");
const path       = require("path");

dotenv.config();

const connectDB  = require("./config/db");
const app        = express();
const server     = http.createServer(app);
const PORT       = process.env.PORT || 8081;

// ── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED = [
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.ADMIN_URL,
  process.env.CLIENT_URL,
].filter(Boolean).map(u => u.trim().replace(/\/$/, ""));

console.log("✅ CORS origins:", ALLOWED);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const clean = origin.trim().replace(/\/$/, "");
    if (ALLOWED.includes(clean)) return cb(null, true);
    console.warn("🚫 CORS blocked:", origin);
    cb(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS","PATCH"],
  allowedHeaders: ["Content-Type","Authorization"],
  optionsSuccessStatus: 200,
};

app.options("*", cors(corsOptions));
app.use(cors(corsOptions));

// ── BODY PARSERS ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

// ── HEALTH ────────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok", brand: "Savitri Livings", allowedOrigins: ALLOWED }));

// ── ROUTES ────────────────────────────────────────────────────────────────────
app.use("/api/auth",      require("./routes/auth"));
app.use("/api/products",  require("./routes/products"));
app.use("/api/orders",    require("./routes/orders"));
app.use("/api/leads",     require("./routes/leads"));
app.use("/api/users",     require("./routes/users"));
app.use("/api/campaigns", require("./routes/campaigns"));
app.use("/api/settings",  require("./routes/settings"));

// ── 404 & ERROR ───────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));
app.use((err, req, res, next) => {  // eslint-disable-line no-unused-vars
  console.error("❌", err.message);
  res.status(err.status || 500).json({ success: false, message: err.message || "Internal server error" });
});

// ── SOCKET.IO ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: ALLOWED, methods: ["GET","POST"], credentials: true },
});

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);
  socket.on("joinRoom", (roomId) => { socket.join(String(roomId)); console.log(`👤 ${socket.id} → room ${roomId}`); });
  socket.on("disconnect", () => console.log("🔌 Disconnected:", socket.id));
});

app.set("io", io);

// ── START ─────────────────────────────────────────────────────────────────────
(async () => {
  await connectDB();
  server.listen(PORT, () => console.log(`🚀 Savitri Livings backend on port ${PORT}`));
})();

// ── GRACEFUL SHUTDOWN ─────────────────────────────────────────────────────────
const shutdown = async () => {
  const mongoose = require("mongoose");
  await mongoose.disconnect();
  server.close(() => process.exit(0));
};
process.on("SIGINT",  shutdown);
process.on("SIGTERM", shutdown);
process.on("uncaughtException",  (e) => console.error("⚠️ Uncaught:",  e));
process.on("unhandledRejection", (e) => console.error("⚠️ Unhandled:", e));
