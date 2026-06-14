import { Router } from "express";
import db from "../database.js";
import { authenticate, requireAdmin, type AuthRequest } from "../middleware/auth.js";

const router = Router();

// POST /api/orders
router.post("/", authenticate, (req: AuthRequest, res) => {
  try {
    const { items, order_type, address } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "At least one item is required" });
      return;
    }

    const validOrderTypes = ["dine-in", "delivery"];
    if (order_type && !validOrderTypes.includes(order_type)) {
      res.status(400).json({ error: `Invalid order type. Must be one of: ${validOrderTypes.join(", ")}` });
      return;
    }

    if (order_type === "delivery" && !address) {
      res.status(400).json({ error: "Address is required for delivery orders" });
      return;
    }

    // Calculate total and validate items
    let total = 0;
    const resolvedItems: { menu_item_id: number; quantity: number; price: number }[] = [];

    for (const item of items) {
      const menuItem = db.prepare(
        "SELECT id, price, is_available FROM menu_items WHERE id = ?"
      ).get(item.menu_item_id) as { id: number; price: number; is_available: number } | undefined;

      if (!menuItem) {
        res.status(404).json({ error: `Menu item with id ${item.menu_item_id} not found` });
        return;
      }

      if (!menuItem.is_available) {
        res.status(400).json({ error: `Menu item with id ${item.menu_item_id} is not available` });
        return;
      }

      const quantity = parseInt(item.quantity, 10);
      if (isNaN(quantity) || quantity < 1) {
        res.status(400).json({ error: "Quantity must be a positive number" });
        return;
      }

      total += menuItem.price * quantity;
      resolvedItems.push({
        menu_item_id: menuItem.id,
        quantity,
        price: menuItem.price,
      });
    }

    // Create order and order items in a transaction
    const createOrder = db.transaction(() => {
      const orderResult = db.prepare(
        "INSERT INTO orders (user_id, order_type, total, address) VALUES (?, ?, ?, ?)"
      ).run(req.user!.id, order_type || "dine-in", total, address || null);

      const orderId = orderResult.lastInsertRowid;

      const insertOrderItem = db.prepare(
        "INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)"
      );

      for (const item of resolvedItems) {
        insertOrderItem.run(orderId, item.menu_item_id, item.quantity, item.price);
      }

      return orderId;
    });

    const orderId = createOrder();

    // Fetch the created order with items
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
    const orderItems = db.prepare(`
      SELECT oi.*, mi.name as item_name, mi.category
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?
    `).all(orderId);

    res.status(201).json({ order, items: orderItems });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/orders
router.get("/", authenticate, (req: AuthRequest, res) => {
  try {
    let orders;

    if (req.user!.role === "admin") {
      orders = db.prepare(`
        SELECT o.*, u.name as user_name, u.email as user_email
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
      `).all();
    } else {
      orders = db.prepare(
        "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC"
      ).all(req.user!.id);
    }

    // Attach items to each order
    const getOrderItems = db.prepare(`
      SELECT oi.*, mi.name as item_name, mi.category
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?
    `);

    const ordersWithItems = (orders as { id: number }[]).map((order) => ({
      ...order,
      items: getOrderItems.all(order.id),
    }));

    res.json({ orders: ordersWithItems });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/orders/:id
router.get("/:id", authenticate, (req: AuthRequest, res) => {
  try {
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id) as {
      id: number; user_id: number;
    } | undefined;

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // Only the owner or admin can view the order
    if (order.user_id !== req.user!.id && req.user!.role !== "admin") {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const items = db.prepare(`
      SELECT oi.*, mi.name as item_name, mi.category
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?
    `).all(order.id);

    res.json({ order, items });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/orders/:id/status (admin only)
router.put("/:id/status", authenticate, requireAdmin, (req: AuthRequest, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: "Status is required" });
      return;
    }

    const validStatuses = ["pending", "preparing", "ready", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
      return;
    }

    const existing = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, req.params.id);

    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
    const items = db.prepare(`
      SELECT oi.*, mi.name as item_name, mi.category
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = ?
    `).all(req.params.id);

    res.json({ order, items });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
