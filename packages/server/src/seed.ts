import bcrypt from "bcryptjs";
import db from "./database.js";

export function seedDb(): void {
  // Check if data already exists
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (userCount.count > 0) {
    console.log("[SEED] Database already seeded, skipping...");
    return;
  }

  console.log("[SEED] Seeding database...");

  // ---------- Users ----------
  const adminHash = bcrypt.hashSync("admin123", 10);
  const memberHash = bcrypt.hashSync("member123", 10);

  const insertUser = db.prepare(
    "INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)"
  );

  insertUser.run("Admin", "admin@gokyo.com", adminHash, "+977-9800000001", "admin");
  insertUser.run("Kobit Gurung", "kobit@email.com", memberHash, "+977-9800000002", "member");

  // ---------- Tables ----------
  const insertTable = db.prepare(
    "INSERT INTO tables (table_number, capacity, location) VALUES (?, ?, ?)"
  );

  // 6 indoor tables
  insertTable.run(1, 2, "indoor");
  insertTable.run(2, 2, "indoor");
  insertTable.run(3, 4, "indoor");
  insertTable.run(4, 4, "indoor");
  insertTable.run(5, 6, "indoor");
  insertTable.run(6, 6, "indoor");
  // 4 outdoor tables
  insertTable.run(7, 2, "outdoor");
  insertTable.run(8, 2, "outdoor");
  insertTable.run(9, 4, "outdoor");
  insertTable.run(10, 4, "outdoor");

  // ---------- Menu Items ----------
  const insertMenuItem = db.prepare(
    "INSERT INTO menu_items (name, description, price, category, image_url, is_premium) VALUES (?, ?, ?, ?, ?, ?)"
  );

  // Appetizers
  insertMenuItem.run(
    "Momo (Steamed)",
    "Traditional Nepali steamed dumplings filled with seasoned chicken and served with tomato achar",
    350, "appetizer", null, 0
  );
  insertMenuItem.run(
    "Momo (Fried)",
    "Crispy golden fried dumplings with chicken filling, served with spicy chutney",
    380, "appetizer", null, 0
  );
  insertMenuItem.run(
    "Chatamari",
    "Newari rice crepe topped with minced meat, egg, and fresh vegetables - the Nepali pizza",
    320, "appetizer", null, 0
  );
  insertMenuItem.run(
    "Sekuwa Skewers",
    "Succulent marinated meat grilled on skewers with Himalayan spices",
    450, "appetizer", null, 0
  );
  insertMenuItem.run(
    "Aloo Sadeko",
    "Spiced potato salad tossed with mustard oil, fresh herbs, and roasted sesame seeds",
    250, "appetizer", null, 0
  );
  insertMenuItem.run(
    "Choila",
    "Spiced grilled buffalo meat salad, a classic Newari delicacy with aromatic spices",
    420, "appetizer", null, 0
  );

  // Main Courses
  insertMenuItem.run(
    "Dal Bhat Tarkari",
    "The quintessential Nepali meal - steamed rice, lentil soup, seasonal vegetables, pickle, and papad",
    450, "main_course", null, 0
  );
  insertMenuItem.run(
    "Thakali Set",
    "Complete Thakali thali with rice, dal, meat curry, spinach, pickle, and ghee",
    650, "main_course", null, 0
  );
  insertMenuItem.run(
    "Gorkhali Lamb Curry",
    "Slow-cooked lamb in a rich and spicy Gorkhali-style gravy with bold Himalayan spices",
    800, "main_course", null, 0
  );
  insertMenuItem.run(
    "Newari Khaja Set",
    "Traditional Newari feast platter with beaten rice, marinated meats, beans, and pickles",
    700, "main_course", null, 0
  );
  insertMenuItem.run(
    "Butter Chicken",
    "Tender chicken pieces in a creamy tomato-based butter sauce, a timeless classic",
    550, "main_course", null, 0
  );
  insertMenuItem.run(
    "Chicken Biryani",
    "Fragrant basmati rice layered with spiced chicken, caramelized onions, and saffron",
    500, "main_course", null, 0
  );
  insertMenuItem.run(
    "Paneer Tikka Masala",
    "Grilled paneer cubes in a smoky and creamy spiced tomato gravy",
    480, "main_course", null, 0
  );
  insertMenuItem.run(
    "Fish Curry",
    "Fresh river fish simmered in a tangy mustard and turmeric gravy, Nepali style",
    600, "main_course", null, 0
  );

  // Desserts
  insertMenuItem.run(
    "Juju Dhau",
    "The famous king of yogurt from Bhaktapur, creamy and naturally sweetened in a clay pot",
    250, "dessert", null, 0
  );
  insertMenuItem.run(
    "Sel Roti",
    "Traditional ring-shaped sweet rice bread, crispy outside and soft inside",
    200, "dessert", null, 0
  );
  insertMenuItem.run(
    "Kheer",
    "Creamy rice pudding slow-cooked with milk, cardamom, nuts, and saffron",
    280, "dessert", null, 0
  );
  insertMenuItem.run(
    "Yomari",
    "Sweet Newari dumpling filled with molasses and sesame, steamed to perfection",
    350, "dessert", null, 0
  );

  // Beverages
  insertMenuItem.run(
    "Masala Tea",
    "Aromatic Nepali chiya brewed with ginger, cardamom, cinnamon, and fresh milk",
    100, "beverage", null, 0
  );
  insertMenuItem.run(
    "Fresh Lime Soda",
    "Refreshing lime juice with soda water, a perfect thirst quencher",
    150, "beverage", null, 0
  );
  insertMenuItem.run(
    "Lassi (Mango)",
    "Thick and creamy mango yogurt smoothie, sweet and refreshing",
    200, "beverage", null, 0
  );
  insertMenuItem.run(
    "Tongba (Millet Beer)",
    "Traditional fermented millet drink from the Himalayas, served warm in a wooden pot",
    250, "beverage", null, 0
  );

  // Premium Beverages
  insertMenuItem.run(
    "Everest Beer",
    "Nepal's iconic premium lager, crisp and refreshing from the land of the Himalayas",
    500, "premium_beverage", null, 1
  );
  insertMenuItem.run(
    "Khukri Rum",
    "Nepal's finest dark rum, smooth and full-bodied with rich caramel notes",
    800, "premium_beverage", null, 1
  );
  insertMenuItem.run(
    "Red Wine",
    "Imported red wine, full-bodied with rich berry flavors and a smooth finish",
    1500, "premium_beverage", null, 1
  );
  insertMenuItem.run(
    "Single Malt Whiskey",
    "Premium single malt Scotch whiskey, aged and refined with a smoky character",
    2500, "premium_beverage", null, 1
  );

  // ---------- Offers ----------
  const insertOffer = db.prepare(
    "INSERT INTO offers (title, description, discount_percent, valid_from, valid_to, is_active) VALUES (?, ?, ?, ?, ?, ?)"
  );

  insertOffer.run(
    "Weekend Special 10% Off",
    "Enjoy a flat 10% discount on all dine-in orders every Saturday and Sunday!",
    10, "2026-01-01", "2026-12-31", 1
  );
  insertOffer.run(
    "Happy Hour Beverages 15% Off",
    "Get 15% off on all beverages every day from 4 PM to 7 PM!",
    15, "2026-01-01", "2026-12-31", 1
  );

  console.log("[SEED] Database seeded successfully");
}
