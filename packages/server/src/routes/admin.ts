import { Router } from "express";
import db from "../database.js";
import { authenticate, requireAdmin, type AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/admin/dashboard
router.get("/dashboard", authenticate, requireAdmin, (_req: AuthRequest, res) => {
  try {
    const totalOrders = db.prepare("SELECT COUNT(*) as count FROM orders").get() as { count: number };
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status != 'cancelled'").get() as { total: number };
    const totalReservations = db.prepare("SELECT COUNT(*) as count FROM reservations").get() as { count: number };
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };

    const recentOrders = db.prepare(`
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `).all();

    const orderStatusCounts = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `).all();

    res.json({
      stats: {
        total_orders: totalOrders.count,
        total_revenue: totalRevenue.total,
        total_reservations: totalReservations.count,
        total_users: totalUsers.count,
      },
      recent_orders: recentOrders,
      order_status_counts: orderStatusCounts,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/reports
router.get("/reports", authenticate, requireAdmin, (_req: AuthRequest, res) => {
  try {
    // Revenue by day (last 30 days)
    const revenueByDay = db.prepare(`
      SELECT DATE(created_at) as date, COALESCE(SUM(total), 0) as revenue, COUNT(*) as order_count
      FROM orders
      WHERE status != 'cancelled'
        AND created_at >= datetime('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `).all();

    // Popular items (top 10 by order count)
    const popularItems = db.prepare(`
      SELECT mi.id, mi.name, mi.category, mi.price,
        SUM(oi.quantity) as total_ordered,
        COUNT(DISTINCT oi.order_id) as order_count
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      GROUP BY mi.id
      ORDER BY total_ordered DESC
      LIMIT 10
    `).all();

    // Booking trends (reservations per day, last 30 days)
    const bookingTrends = db.prepare(`
      SELECT date, COUNT(*) as reservation_count, SUM(guests) as total_guests
      FROM reservations
      WHERE status != 'cancelled'
        AND date >= date('now', '-30 days')
      GROUP BY date
      ORDER BY date DESC
    `).all();

    res.json({
      revenue_by_day: revenueByDay,
      popular_items: popularItems,
      booking_trends: bookingTrends,
    });
  } catch (error) {
    console.error("Reports error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/offers
router.post("/offers", authenticate, requireAdmin, (req: AuthRequest, res) => {
  try {
    const { title, description, discount_percent, valid_from, valid_to } = req.body;

    if (!title || discount_percent === undefined) {
      res.status(400).json({ error: "Title and discount_percent are required" });
      return;
    }

    if (discount_percent <= 0 || discount_percent > 100) {
      res.status(400).json({ error: "Discount percent must be between 0 and 100" });
      return;
    }

    const result = db.prepare(
      "INSERT INTO offers (title, description, discount_percent, valid_from, valid_to) VALUES (?, ?, ?, ?, ?)"
    ).run(title, description || null, discount_percent, valid_from || null, valid_to || null);

    const offer = db.prepare("SELECT * FROM offers WHERE id = ?").get(result.lastInsertRowid);

    res.status(201).json({ offer });
  } catch (error) {
    console.error("Create offer error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/offers
router.get("/offers", (_req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const offers = db.prepare(
      "SELECT * FROM offers WHERE is_active = 1 AND (valid_to IS NULL OR valid_to >= ?) ORDER BY created_at DESC"
    ).all(today);

    res.json({ offers });
  } catch (error) {
    console.error("Get offers error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/offers/:id
router.put("/offers/:id", authenticate, requireAdmin, (req: AuthRequest, res) => {
  try {
    const { title, description, discount_percent, valid_from, valid_to, is_active } = req.body;

    const existing = db.prepare("SELECT * FROM offers WHERE id = ?").get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Offer not found" });
      return;
    }

    db.prepare(`
      UPDATE offers SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        discount_percent = COALESCE(?, discount_percent),
        valid_from = COALESCE(?, valid_from),
        valid_to = COALESCE(?, valid_to),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(
      title || null,
      description !== undefined ? description : null,
      discount_percent !== undefined ? discount_percent : null,
      valid_from !== undefined ? valid_from : null,
      valid_to !== undefined ? valid_to : null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      req.params.id
    );

    const offer = db.prepare("SELECT * FROM offers WHERE id = ?").get(req.params.id);
    res.json({ offer });
  } catch (error) {
    console.error("Update offer error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/offers/:id (deactivate)
router.delete("/offers/:id", authenticate, requireAdmin, (req: AuthRequest, res) => {
  try {
    const existing = db.prepare("SELECT * FROM offers WHERE id = ?").get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Offer not found" });
      return;
    }

    db.prepare("UPDATE offers SET is_active = 0 WHERE id = ?").run(req.params.id);
    res.json({ message: "Offer deactivated successfully" });
  } catch (error) {
    console.error("Delete offer error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
