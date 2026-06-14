import initSqlJs, { type Database as SqlJsDatabase } from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "..", "gokyo.db");

// Wrapper around sql.js to provide a better-sqlite3-like API
class Database {
  private _db: SqlJsDatabase | null = null;

  get db(): SqlJsDatabase {
    if (!this._db) throw new Error("Database not initialized. Call initDb() first.");
    return this._db;
  }

  async init(): Promise<void> {
    const SQL = await initSqlJs();

    // Load existing database file if it exists
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      this._db = new SQL.Database(buffer);
    } else {
      this._db = new SQL.Database();
    }

    // Enable foreign keys
    this.db.run("PRAGMA foreign_keys = ON");
  }

  save(): void {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }

  exec(sql: string): void {
    this.db.run(sql);
    this.save();
  }

  private _inTransaction = false;

  prepare(sql: string) {
    const database = this;
    return {
      run(...params: unknown[]) {
        const stmt = database.db.prepare(sql);
        stmt.bind(params.map((p) => (p === undefined ? null : p) as initSqlJs.BindParams[number]));
        stmt.step();
        stmt.free();

        // Get last insert rowid and changes BEFORE saving
        const lastIdResult = database.db.exec("SELECT last_insert_rowid() as id");
        const changesResult = database.db.exec("SELECT changes() as c");
        const lastInsertRowid = (lastIdResult[0]?.values[0]?.[0] ?? 0) as number;
        const changes = (changesResult[0]?.values[0]?.[0] ?? 0) as number;

        // Only save to disk if not inside a transaction
        if (!database._inTransaction) {
          database.save();
        }

        return { lastInsertRowid, changes };
      },

      get(...params: unknown[]) {
        const stmt = database.db.prepare(sql);
        stmt.bind(params.map((p) => (p === undefined ? null : p) as initSqlJs.BindParams[number]));

        if (stmt.step()) {
          const columns = stmt.getColumnNames();
          const values = stmt.get();
          stmt.free();
          const row: Record<string, unknown> = {};
          for (let i = 0; i < columns.length; i++) {
            row[columns[i]!] = values[i];
          }
          return row;
        }
        stmt.free();
        return undefined;
      },

      all(...params: unknown[]) {
        const stmt = database.db.prepare(sql);
        stmt.bind(params.map((p) => (p === undefined ? null : p) as initSqlJs.BindParams[number]));

        const rows: Record<string, unknown>[] = [];
        while (stmt.step()) {
          const columns = stmt.getColumnNames();
          const values = stmt.get();
          const row: Record<string, unknown> = {};
          for (let i = 0; i < columns.length; i++) {
            row[columns[i]!] = values[i];
          }
          rows.push(row);
        }
        stmt.free();
        return rows;
      },
    };
  }

  transaction<T>(fn: () => T): () => T {
    return () => {
      this._inTransaction = true;
      try {
        const result = fn();
        this.save();
        return result;
      } catch (error) {
        this._inTransaction = false;
        throw error;
      } finally {
        this._inTransaction = false;
      }
    };
  }
}

const db = new Database();

export async function initDb(): Promise<void> {
  await db.init();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      role TEXT DEFAULT 'member' CHECK(role IN ('visitor','member','admin')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT,
      is_premium INTEGER DEFAULT 0,
      is_available INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number INTEGER UNIQUE NOT NULL,
      capacity INTEGER NOT NULL,
      location TEXT CHECK(location IN ('indoor','outdoor')),
      is_available INTEGER DEFAULT 1
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      table_id INTEGER REFERENCES tables(id),
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      guests INTEGER NOT NULL,
      status TEXT DEFAULT 'confirmed' CHECK(status IN ('confirmed','cancelled','completed')),
      advance_paid REAL DEFAULT 1200,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      order_type TEXT DEFAULT 'dine-in' CHECK(order_type IN ('dine-in','delivery')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','preparing','ready','delivered','cancelled')),
      total REAL NOT NULL,
      address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id),
      menu_item_id INTEGER REFERENCES menu_items(id),
      quantity INTEGER NOT NULL,
      price REAL NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id),
      reservation_id INTEGER REFERENCES reservations(id),
      amount REAL NOT NULL,
      method TEXT CHECK(method IN ('cash','online')),
      status TEXT DEFAULT 'completed',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      order_id INTEGER REFERENCES orders(id),
      food_rating INTEGER,
      service_rating INTEGER,
      ambience_rating INTEGER,
      comment TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      discount_percent REAL NOT NULL,
      valid_from TEXT,
      valid_to TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("[DB] Database initialized successfully");
}

export default db;
