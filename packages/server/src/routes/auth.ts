import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../database.js";
import { authenticate, JWT_SECRET, type AuthRequest } from "../middleware/auth.js";

const router = Router();

// POST /api/auth/register
router.post("/register", (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email, and password are required" });
      return;
    }

    // Check if email already exists
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    db.prepare(
      "INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, 'member')"
    ).run(name, email, passwordHash, phone || null);

    // Query the newly created user by email (more reliable than lastInsertRowid with sql.js)
    const user = db.prepare("SELECT id, name, email, phone, role, created_at FROM users WHERE email = ?").get(email) as { id: number } | undefined;

    if (!user) {
      res.status(500).json({ error: "Failed to create user" });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ token, user });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = db.prepare(
      "SELECT id, name, email, password_hash, phone, address, role, created_at FROM users WHERE email = ?"
    ).get(email) as { id: number; name: string; email: string; password_hash: string; phone: string; address: string; role: string; created_at: string } | undefined;

    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    const { password_hash: _, ...userWithoutPassword } = user;

    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/me", authenticate, (req: AuthRequest, res) => {
  try {
    const user = db.prepare(
      "SELECT id, name, email, phone, address, role, created_at FROM users WHERE id = ?"
    ).get(req.user!.id);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/auth/profile
router.put("/profile", authenticate, (req: AuthRequest, res) => {
  try {
    const { name, phone, address } = req.body;
    const userId = req.user!.id;

    db.prepare(
      "UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), address = COALESCE(?, address) WHERE id = ?"
    ).run(name || null, phone || null, address || null, userId);

    const user = db.prepare(
      "SELECT id, name, email, phone, address, role, created_at FROM users WHERE id = ?"
    ).get(userId);

    res.json({ user });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
