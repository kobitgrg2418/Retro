import { Router } from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "../database.js";
import { authenticate, requireAdmin, JWT_SECRET, type AuthRequest } from "../middleware/auth.js";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uploaded menu images live here and are served at /uploads/menu/<file>.
export const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "menu");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = (path.extname(file.originalname) || ".jpg").toLowerCase();
    const safe = ext.replace(/[^.a-z0-9]/g, "");
    cb(null, `item-${Date.now()}-${Math.round(Math.random() * 1e9)}${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    // Silently ignore non-image uploads (req.file stays undefined).
    cb(null, file.mimetype.startsWith("image/"));
  },
});

const VALID_CATEGORIES = ["appetizer", "main_course", "dessert", "beverage", "premium_beverage"];

// Coercion helpers — multipart form fields arrive as strings.
function toNumber(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}
function toBool(v: unknown): boolean {
  return v === true || v === 1 || v === "1" || v === "true" || v === "on";
}

/** Deletes an uploaded image file (only files we own under /uploads/menu). */
function removeUploadedImage(imageUrl: unknown): void {
  if (typeof imageUrl !== "string") return;
  if (!imageUrl.startsWith("/uploads/menu/")) return; // never touch bundled crops
  const file = path.join(UPLOAD_DIR, path.basename(imageUrl));
  fs.promises.unlink(file).catch(() => { /* already gone */ });
}

// GET /api/menu
router.get("/", (req: AuthRequest, res) => {
  try {
    const { category } = req.query;

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
        // treat as non-admin
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

// POST /api/menu (admin only) — accepts JSON or multipart (with "image" file)
router.post("/", authenticate, requireAdmin, upload.single("image"), (req: AuthRequest, res) => {
  try {
    const { name, description, category } = req.body;
    const price = toNumber(req.body.price);

    if (!name || price === undefined || !category) {
      res.status(400).json({ error: "Name, price, and category are required" });
      return;
    }
    if (!VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` });
      return;
    }

    const imageUrl = req.file ? `/uploads/menu/${req.file.filename}` : (req.body.image_url || null);

    const result = db.prepare(
      "INSERT INTO menu_items (name, description, price, category, image_url, is_premium, is_available) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(
      name,
      description || null,
      price,
      category,
      imageUrl,
      toBool(req.body.is_premium) ? 1 : 0,
      req.body.is_available === undefined ? 1 : (toBool(req.body.is_available) ? 1 : 0)
    );

    const item = db.prepare("SELECT * FROM menu_items WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json({ item });
  } catch (error) {
    console.error("Create menu item error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/menu/:id (admin only) — accepts JSON or multipart (with "image" file)
router.put("/:id", authenticate, requireAdmin, upload.single("image"), (req: AuthRequest, res) => {
  try {
    const existing = db.prepare("SELECT * FROM menu_items WHERE id = ?").get(req.params.id) as
      | { image_url: string | null } | undefined;
    if (!existing) {
      res.status(404).json({ error: "Menu item not found" });
      return;
    }

    const { name, description, category } = req.body;
    const price = toNumber(req.body.price);

    if (category && !VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` });
      return;
    }

    // New image replaces the old one (and the old uploaded file is removed).
    let imageUrl: string | null | undefined;
    if (req.file) {
      imageUrl = `/uploads/menu/${req.file.filename}`;
      removeUploadedImage(existing.image_url);
    } else if (req.body.image_url !== undefined) {
      imageUrl = req.body.image_url || null;
    } else {
      imageUrl = undefined; // keep existing
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
      imageUrl !== undefined ? imageUrl : null,
      req.body.is_premium !== undefined ? (toBool(req.body.is_premium) ? 1 : 0) : null,
      req.body.is_available !== undefined ? (toBool(req.body.is_available) ? 1 : 0) : null,
      req.params.id
    );

    const item = db.prepare("SELECT * FROM menu_items WHERE id = ?").get(req.params.id);
    res.json({ item });
  } catch (error) {
    console.error("Update menu item error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/menu/:id (admin only) — hard delete + remove uploaded image.
// If the item is referenced by past orders, it is archived (soft-deleted) instead.
router.delete("/:id", authenticate, requireAdmin, (req: AuthRequest, res) => {
  try {
    const existing = db.prepare("SELECT * FROM menu_items WHERE id = ?").get(req.params.id) as
      | { id: number; image_url: string | null } | undefined;
    if (!existing) {
      res.status(404).json({ error: "Menu item not found" });
      return;
    }

    const refs = db.prepare("SELECT COUNT(*) AS c FROM order_items WHERE menu_item_id = ?")
      .get(req.params.id) as { c: number };

    if (refs.c > 0) {
      // Keep the row (and its image) so order history stays intact.
      db.prepare("UPDATE menu_items SET is_available = 0 WHERE id = ?").run(req.params.id);
      res.json({ message: "Item has past orders — archived (hidden) instead of deleted.", archived: true });
      return;
    }

    db.prepare("DELETE FROM menu_items WHERE id = ?").run(req.params.id);
    removeUploadedImage(existing.image_url);
    res.json({ message: "Menu item deleted successfully", deleted: true });
  } catch (error) {
    console.error("Delete menu item error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
