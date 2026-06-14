import express from "express";
import cors from "cors";
import { initDb } from "./database.js";
import { seedDb } from "./seed.js";
import authRoutes from "./routes/auth.js";
import menuRoutes from "./routes/menu.js";
import reservationRoutes from "./routes/reservations.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payments.js";
import feedbackRoutes from "./routes/feedback.js";
import adminRoutes from "./routes/admin.js";

const app = express();
const PORT = parseInt(process.env.SERVER_PORT || "3001", 10);

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api", reservationRoutes); // handles /api/tables/available and /api/reservations
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", adminRoutes); // also mount for /api/offers

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", name: "Gokyo Bistro API", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Initialize database and start server
async function main() {
  await initDb();
  seedDb();

  app.listen(PORT, () => {
    console.log(`Gokyo Bistro API server running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

export default app;
