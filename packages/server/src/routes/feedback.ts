import { Router } from "express";
import db from "../database.js";
import { authenticate, requireAdmin, type AuthRequest } from "../middleware/auth.js";

const router = Router();

// POST /api/feedback
router.post("/", authenticate, (req: AuthRequest, res) => {
  try {
    const { order_id, food_rating, service_rating, ambience_rating, comment } = req.body;

    if (food_rating === undefined || service_rating === undefined || ambience_rating === undefined) {
      res.status(400).json({ error: "food_rating, service_rating, and ambience_rating are required" });
      return;
    }

    // Validate ratings are between 1 and 5
    for (const [name, value] of Object.entries({ food_rating, service_rating, ambience_rating })) {
      const rating = parseInt(value as string, 10);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        res.status(400).json({ error: `${name} must be between 1 and 5` });
        return;
      }
    }

    // Validate order if provided
    if (order_id) {
      const order = db.prepare("SELECT id, user_id FROM orders WHERE id = ?").get(order_id) as { id: number; user_id: number } | undefined;
      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      if (order.user_id !== req.user!.id && req.user!.role !== "admin") {
        res.status(403).json({ error: "You can only leave feedback for your own orders" });
        return;
      }
    }

    const result = db.prepare(
      "INSERT INTO feedback (user_id, order_id, food_rating, service_rating, ambience_rating, comment) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(req.user!.id, order_id || null, food_rating, service_rating, ambience_rating, comment || null);

    const feedback = db.prepare("SELECT * FROM feedback WHERE id = ?").get(result.lastInsertRowid);

    res.status(201).json({ feedback });
  } catch (error) {
    console.error("Create feedback error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/feedback (admin only)
router.get("/", authenticate, requireAdmin, (_req: AuthRequest, res) => {
  try {
    const feedbacks = db.prepare(`
      SELECT f.*, u.name as user_name, u.email as user_email
      FROM feedback f
      JOIN users u ON f.user_id = u.id
      ORDER BY f.created_at DESC
    `).all();

    res.json({ feedback: feedbacks });
  } catch (error) {
    console.error("Get feedback error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
