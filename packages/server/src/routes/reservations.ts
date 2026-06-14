import { Router } from "express";
import db from "../database.js";
import { authenticate, requireAdmin, type AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/tables/available
router.get("/tables/available", (req, res) => {
  try {
    const { date, time, guests } = req.query;

    if (!date || !time || !guests) {
      res.status(400).json({ error: "Date, time, and guests are required query parameters" });
      return;
    }

    const guestCount = parseInt(guests as string, 10);
    if (isNaN(guestCount) || guestCount < 1) {
      res.status(400).json({ error: "Guests must be a positive number" });
      return;
    }

    // Find tables with enough capacity that are not reserved for the given date/time
    const tables = db.prepare(`
      SELECT t.* FROM tables t
      WHERE t.is_available = 1
        AND t.capacity >= ?
        AND t.id NOT IN (
          SELECT r.table_id FROM reservations r
          WHERE r.date = ? AND r.time = ? AND r.status = 'confirmed'
        )
      ORDER BY t.capacity ASC
    `).all(guestCount, date, time);

    res.json({ tables });
  } catch (error) {
    console.error("Get available tables error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/reservations
router.post("/reservations", authenticate, (req: AuthRequest, res) => {
  try {
    const { table_id, date, time, guests } = req.body;

    if (!table_id || !date || !time || !guests) {
      res.status(400).json({ error: "table_id, date, time, and guests are required" });
      return;
    }

    // Check table exists and has capacity
    const table = db.prepare("SELECT * FROM tables WHERE id = ? AND is_available = 1").get(table_id) as { id: number; capacity: number } | undefined;
    if (!table) {
      res.status(404).json({ error: "Table not found or unavailable" });
      return;
    }

    if (table.capacity < guests) {
      res.status(400).json({ error: `Table capacity (${table.capacity}) is less than the number of guests (${guests})` });
      return;
    }

    // Check if table is already reserved for that date/time
    const existingReservation = db.prepare(
      "SELECT id FROM reservations WHERE table_id = ? AND date = ? AND time = ? AND status = 'confirmed'"
    ).get(table_id, date, time);

    if (existingReservation) {
      res.status(409).json({ error: "Table is already reserved for this date and time" });
      return;
    }

    const result = db.prepare(
      "INSERT INTO reservations (user_id, table_id, date, time, guests, advance_paid) VALUES (?, ?, ?, ?, ?, 1200)"
    ).run(req.user!.id, table_id, date, time, guests);

    const reservation = db.prepare(`
      SELECT r.*, t.table_number, t.location, t.capacity
      FROM reservations r
      JOIN tables t ON r.table_id = t.id
      WHERE r.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ reservation });
  } catch (error) {
    console.error("Create reservation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/reservations
router.get("/reservations", authenticate, (req: AuthRequest, res) => {
  try {
    let reservations;

    if (req.user!.role === "admin") {
      reservations = db.prepare(`
        SELECT r.*, t.table_number, t.location, t.capacity, u.name as user_name, u.email as user_email
        FROM reservations r
        JOIN tables t ON r.table_id = t.id
        JOIN users u ON r.user_id = u.id
        ORDER BY r.date DESC, r.time DESC
      `).all();
    } else {
      reservations = db.prepare(`
        SELECT r.*, t.table_number, t.location, t.capacity
        FROM reservations r
        JOIN tables t ON r.table_id = t.id
        WHERE r.user_id = ?
        ORDER BY r.date DESC, r.time DESC
      `).all(req.user!.id);
    }

    res.json({ reservations });
  } catch (error) {
    console.error("Get reservations error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/reservations/:id (admin only)
router.put("/reservations/:id", authenticate, requireAdmin, (req: AuthRequest, res) => {
  try {
    const { status } = req.body;

    const existing = db.prepare("SELECT * FROM reservations WHERE id = ?").get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Reservation not found" });
      return;
    }

    const validStatuses = ["confirmed", "cancelled", "completed"];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
      return;
    }

    db.prepare("UPDATE reservations SET status = ? WHERE id = ?").run(status, req.params.id);

    const reservation = db.prepare(`
      SELECT r.*, t.table_number, t.location, t.capacity
      FROM reservations r
      JOIN tables t ON r.table_id = t.id
      WHERE r.id = ?
    `).get(req.params.id);

    res.json({ reservation });
  } catch (error) {
    console.error("Update reservation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/reservations/:id (authenticated - cancel reservation)
router.delete("/reservations/:id", authenticate, (req: AuthRequest, res) => {
  try {
    const reservation = db.prepare("SELECT * FROM reservations WHERE id = ?").get(req.params.id) as {
      id: number; user_id: number; date: string; status: string; advance_paid: number;
    } | undefined;

    if (!reservation) {
      res.status(404).json({ error: "Reservation not found" });
      return;
    }

    // Only the owner or admin can cancel
    if (reservation.user_id !== req.user!.id && req.user!.role !== "admin") {
      res.status(403).json({ error: "You can only cancel your own reservations" });
      return;
    }

    if (reservation.status === "cancelled") {
      res.status(400).json({ error: "Reservation is already cancelled" });
      return;
    }

    // Check if same day cancellation - deduct Rs. 500
    const today = new Date().toISOString().split("T")[0];
    let advancePaid = reservation.advance_paid;

    if (reservation.date === today) {
      advancePaid = Math.max(0, advancePaid - 500);
      db.prepare("UPDATE reservations SET status = 'cancelled', advance_paid = ? WHERE id = ?")
        .run(advancePaid, req.params.id);
    } else {
      db.prepare("UPDATE reservations SET status = 'cancelled' WHERE id = ?")
        .run(req.params.id);
    }

    const updated = db.prepare(`
      SELECT r.*, t.table_number, t.location, t.capacity
      FROM reservations r
      JOIN tables t ON r.table_id = t.id
      WHERE r.id = ?
    `).get(req.params.id);

    res.json({
      reservation: updated,
      message: reservation.date === today
        ? "Reservation cancelled. Rs. 500 deducted from advance due to same-day cancellation."
        : "Reservation cancelled. Full advance will be refunded."
    });
  } catch (error) {
    console.error("Cancel reservation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
