#!/usr/bin/env node

/**
 * Database Initialization Script
 *
 * This script initializes the SQLite database with the schema and seed data.
 * It can be run manually or as part of the setup process.
 */

const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// Configuration
const DB_PATH = path.join(__dirname, "..", "database.sqlite");
const SCHEMA_PATH = path.join(__dirname, "..", "sql", "schema.sql");

console.log("=== ElectroStore Database Initialization ===");
console.log(`Database: ${DB_PATH}`);
console.log(`Schema: ${SCHEMA_PATH}`);

// Check if database already exists
const dbExists = fs.existsSync(DB_PATH);
if (dbExists) {
  console.log("\n⚠️  Database already exists.");
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.question(
    "Do you want to delete and recreate it? (yes/no): ",
    (answer) => {
      if (answer.toLowerCase() === "yes" || answer.toLowerCase() === "y") {
        console.log("Deleting existing database...");
        fs.unlinkSync(DB_PATH);
        initializeDatabase();
      } else {
        console.log("Keeping existing database.");
        process.exit(0);
      }
      readline.close();
    },
  );
} else {
  initializeDatabase();
}

/**
 * Initialize the database with schema and seed data
 */
function initializeDatabase() {
  console.log("\n📦 Creating new database...");

  // Create database connection
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error("❌ Error opening database:", err.message);
      process.exit(1);
    }
    console.log("✅ Connected to SQLite database");
  });

  // Read schema file
  fs.readFile(SCHEMA_PATH, "utf8", (err, schemaSQL) => {
    if (err) {
      console.error("❌ Error reading schema file:", err);
      db.close();
      process.exit(1);
    }

    console.log("📄 Executing schema...");

    // Execute schema
    db.exec(schemaSQL, (err) => {
      if (err) {
        console.error("❌ Error executing schema:", err);
        db.close();
        process.exit(1);
      }

      console.log("✅ Database schema initialized successfully");

      // Verify the initialization
      verifyDatabase(db);
    });
  });
}

/**
 * Verify database was initialized correctly
 */
function verifyDatabase(db) {
  console.log("\n🔍 Verifying database setup...");

  const queries = [
    { sql: "SELECT COUNT(*) as count FROM users", table: "users" },
    { sql: "SELECT COUNT(*) as count FROM products", table: "products" },
    { sql: "SELECT COUNT(*) as count FROM orders", table: "orders" },
    { sql: "SELECT COUNT(*) as count FROM order_items", table: "order_items" },
  ];

  let completed = 0;

  queries.forEach(({ sql, table }) => {
    db.get(sql, [], (err, row) => {
      if (err) {
        console.error(`❌ Error checking ${table}:`, err.message);
      } else {
        console.log(`   ${table}: ${row.count} records`);
      }

      completed++;
      if (completed === queries.length) {
        finalizeSetup(db);
      }
    });
  });
}

/**
 * Finalize setup and display credentials
 */
function finalizeSetup(db) {
  console.log("\n📋 Database Setup Complete!");
  console.log("=".repeat(40));

  // Get admin credentials
  db.get(
    "SELECT username, password FROM users WHERE is_admin = 1",
    [],
    (err, admin) => {
      if (err) {
        console.error("❌ Error fetching admin user:", err.message);
      } else if (admin) {
        console.log("\n🔑 Admin Credentials:");
        console.log(`   Username: ${admin.username}`);
        console.log(`   Password: admin (default)`);
        console.log("\n⚠️  Note: The password is hashed in the database.");
        console.log('   Use "admin" as the password when logging in.');
      }

      // Get sample products
      db.all(
        "SELECT name, price FROM products LIMIT 3",
        [],
        (err, products) => {
          if (err) {
            console.error("❌ Error fetching products:", err.message);
          } else if (products && products.length > 0) {
            console.log("\n🛒 Sample Products:");
            products.forEach((product) => {
              console.log(`   ${product.name} - $${product.price}`);
            });
            console.log(`   ... and ${Math.max(0, 6 - products.length)} more`);
          }

          // Close database connection
          db.close((err) => {
            if (err) {
              console.error("❌ Error closing database:", err.message);
            } else {
              console.log("\n✅ Database connection closed");
            }

            console.log("\n🎉 Setup Complete!");
            console.log("=".repeat(40));
            console.log("\nNext steps:");
            console.log("1. Start the server: npm start");
            console.log("2. Start the admin bot: npm run bot");
            console.log("3. Access the app: http://localhost:3000");
            console.log("4. Login as admin: admin / admin");
            console.log("5. Create user accounts and test XSS payloads");
            console.log("\nHappy hacking! 🛡️");

            process.exit(0);
          });
        },
      );
    },
  );
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n\n⚠️  Process interrupted by user");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\n⚠️  Process terminated");
  process.exit(0);
});
