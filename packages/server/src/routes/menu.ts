import { Router } from "express";
import jwt from "jsonwebtoken";
import db from "../database.js";
import { authenticate, requireAdmin, JWT_SECRET, type AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/menu
router.get("/", (req: AuthRequest, res) => {
  try {
    const { category } = req.query;

    // Check if user is admin (optional auth - don't require it)
    let isAdmin = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        if (token) {
          const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
          const user = db.prepare("SELECT role FROM users WHERE id = ?").get(decoded.userId) as { role: string } | undefined;
          if (user?.role === "admin") isAdmin = true;
        }
      } catch {
        // Not authenticated or invalid token - treat as non-admin
      }
    }

    let query: string;
    const params: (string | number)[] = [];

    if (isAdmin) {
      if (category) {
        query = "SELECT * FROM menu_items WHERE category = ? ORDER BY category, name";
        params.push(category as string);
      } else {
        query = "SELECT * FROM menu_items ORDER BY category, name";
      }
    } else {
      if (category) {
        query = "SELECT * FROM menu_items WHERE is_available = 1 AND category = ? ORDER BY category, name";
        params.push(category as string);
      } else {
        query = "SELECT * FROM menu_items WHERE is_available = 1 ORDER BY category, name";
      }
    }

    const items = db.prepare(query).all(...params);
    res.json({ items });
  } catch (error) {
    console.error("Get menu error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/menu/:id
router.get("/:id", (req, res) => {
  try {
    const item = db.prepare("SELECT * FROM menu_items WHERE id = ?").get(req.params.id);
    if (!item) {
      res.status(404).json({ error: "Menu item not found" });
      return;
    }
    res.json({ item });
  } catch (error) {
    console.error("Get menu item error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/menu (admin only)
router.post("/", authenticate, requireAdmin, (req: AuthRequest, res) => {
  try {
    const { name, description, price, category, image_url, is_premium } = req.body;

    if (!name || price === undefined || !category) {
      res.status(400).json({ error: "Name, price, and category are required" });
      return;
    }

    const validCategories = ["appetizer", "main_course", "dessert", "beverage", "premium_beverage"];
    if (!validCategories.includes(category)) {
      res.status(400).json({ error: `Invalid category. Must be one of: ${validCategories.join(", ")}` });
      return;
    }

    const result = db.prepare(
      "INSERT INTO menu_items (name, description, price, category, image_url, is_premium) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(name, description || null, price, category, image_url || null, is_premium ? 1 : 0);

    const item = db.prepare("SELECT * FROM menu_items WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ item });
  } catch (error) {
    console.error("Create menu item error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/menu/:id (admin only)
router.put("/:id", authenticate, requireAdmin, (req: AuthRequest, res) => {
  try {
    const { name, description, price, category, image_url, is_premium, is_available } = req.body;

    const existing = db.prepare("SELECT * FROM menu_items WHERE id = ?").get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Menu item not found" });
      return;
    }

    if (category) {
      const validCategories = ["appetizer", "main_course", "dessert", "beverage", "premium_beverage"];
      if (!validCategories.includes(category)) {
        res.status(400).json({ error: `Invalid category. Must be one of: ${validCategories.join(", ")}` });
        return;
      }
    }

    db.prepare(`
      UPDATE menu_items SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        category = COALESCE(?, category),
        image_url = COALESCE(?, image_url),
        is_premium = COALESCE(?, is_premium),
        is_available = COALESCE(?, is_available)
      WHERE id = ?
    `).run(
      name || null,
      description !== undefined ? description : null,
      price !== undefined ? price : null,
      category || null,
      image_url !== undefined ? image_url : null,
      is_premium !== undefined ? (is_premium ? 1 : 0) : null,
      is_available !== undefined ? (is_available ? 1 : 0) : null,
      req.params.id
    );

    const item = db.prepare("SELECT * FROM menu_items WHERE id = ?").get(req.params.id);
    res.json({ item });
  } catch (error) {
    console.error("Update menu item error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/menu/:id (admin only) - soft delete
router.delete("/:id", authenticate, requireAdmin, (req: AuthRequest, res) => {
  try {
    const existing = db.prepare("SELECT * FROM menu_items WHERE id = ?").get(req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Menu item not found" });
      return;
    }

    db.prepare("UPDATE menu_items SET is_available = 0 WHERE id = ?").run(req.params.id);
    res.json({ message: "Menu item removed successfully" });
  } catch (error) {
    console.error("Delete menu item error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
