import { Router } from "express";
import db from "../database.js";
import { authenticate, type AuthRequest } from "../middleware/auth.js";

const router = Router();

// POST /api/payments
router.post("/", authenticate, (req: AuthRequest, res) => {
  try {
    const { order_id, reservation_id, amount, method } = req.body;

    if (amount === undefined || amount <= 0) {
      res.status(400).json({ error: "A positive amount is required" });
      return;
    }

    if (!method) {
      res.status(400).json({ error: "Payment method is required" });
      return;
    }

    const validMethods = ["cash", "online"];
    if (!validMethods.includes(method)) {
      res.status(400).json({ error: `Invalid payment method. Must be one of: ${validMethods.join(", ")}` });
      return;
    }

    if (!order_id && !reservation_id) {
      res.status(400).json({ error: "Either order_id or reservation_id is required" });
      return;
    }

    // Validate order if provided
    if (order_id) {
      const order = db.prepare("SELECT id, user_id FROM orders WHERE id = ?").get(order_id) as { id: number; user_id: number } | undefined;
      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      if (order.user_id !== req.user!.id && req.user!.role !== "admin") {
        res.status(403).json({ error: "Access denied" });
        return;
      }
    }

    // Validate reservation if provided
    if (reservation_id) {
      const reservation = db.prepare("SELECT id, user_id FROM reservations WHERE id = ?").get(reservation_id) as { id: number; user_id: number } | undefined;
      if (!reservation) {
        res.status(404).json({ error: "Reservation not found" });
        return;
      }
      if (reservation.user_id !== req.user!.id && req.user!.role !== "admin") {
        res.status(403).json({ error: "Access denied" });
        return;
      }
    }

    const result = db.prepare(
      "INSERT INTO payments (order_id, reservation_id, amount, method) VALUES (?, ?, ?, ?)"
    ).run(order_id || null, reservation_id || null, amount, method);

    const payment = db.prepare("SELECT * FROM payments WHERE id = ?").get(result.lastInsertRowid);

    res.status(201).json({ payment });
  } catch (error) {
    console.error("Create payment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
