const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");

class Database {
  constructor() {
    this.db = new sqlite3.Database(
      path.join(__dirname, "database.sqlite"),
      (err) => {
        if (err) {
          console.error("Error opening database:", err.message);
        } else {
          console.log("Connected to SQLite database");
          this.initializeDatabase();
        }
      },
    );
  }

  // Initialize database with schema
  initializeDatabase() {
    const fs = require("fs");
    const schemaPath = path.join(__dirname, "sql", "schema.sql");

    fs.readFile(schemaPath, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading schema file:", err);
        return;
      }

      // If the products table already exists, assume the schema and seed
      // data have been applied previously. Skip executing the SQL to avoid
      // re-inserting seed data which would create duplicate products.
      this.db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='products'",
        (checkErr, row) => {
          if (checkErr) {
            console.error("Error checking existing tables:", checkErr);
            return;
          }

          if (row) {
            console.log(
              "Database already initialized; skipping schema execution",
            );
            return;
          }

          this.db.exec(data, (execErr) => {
            if (execErr) {
              console.error("Error executing schema:", execErr);
            } else {
              console.log("Database schema initialized successfully");
            }
          });
        },
      );
    });
  }

  // User operations
  async createUser(username, password, isAdmin = false) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return new Promise((resolve, reject) => {
      this.db.run(
        "INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)",
        [username, hashedPassword, isAdmin ? 1 : 0],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, username, isAdmin });
        },
      );
    });
  }

  async getUserByUsername(username) {
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT * FROM users WHERE username = ?",
        [username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        },
      );
    });
  }

  async getUserById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT id, username, is_admin, created_at FROM users WHERE id = ?",
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        },
      );
    });
  }

  async verifyUser(username, password) {
    const user = await this.getUserByUsername(username);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    return {
      id: user.id,
      username: user.username,
      isAdmin: user.is_admin === 1,
    };
  }

  // Product operations
  async getAllProducts() {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT * FROM products ORDER BY name", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getProductById(id) {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM products WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Order operations
  async createOrder(userId, address, deliveryNotes, cartItems) {
    return new Promise((resolve, reject) => {
      const db = this.db; // Store reference to db at outer scope

      db.serialize(() => {
        // Create order
        db.run(
          "INSERT INTO orders (user_id, address, delivery_notes, status) VALUES (?, ?, ?, ?)",
          [userId, address, deliveryNotes, "Created"],
          function (err) {
            if (err) {
              reject(err);
              return;
            }

            const orderId = this.lastID;
            const orderItems = [];

            // Insert order items
            const insertItem = (index) => {
              if (index >= cartItems.length) {
                resolve({ orderId, orderItems });
                return;
              }

              const item = cartItems[index];
              db.run(
                "INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES (?, ?, ?, ?)",
                [orderId, item.productId, item.quantity, item.price],
                function (err) {
                  if (err) {
                    reject(err);
                    return;
                  }

                  orderItems.push({
                    id: this.lastID,
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                  });

                  insertItem(index + 1);
                },
              );
            };

            insertItem(0);
          },
        );
      });
    });
  }

  async getOrdersByUserId(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT o.*, 
                 (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count,
                 (SELECT SUM(quantity * price_at_time) FROM order_items WHERE order_id = o.id) as total_amount
                 FROM orders o 
                 WHERE user_id = ? 
                 ORDER BY created_at DESC`,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        },
      );
    });
  }

  async getOrderById(orderId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT o.*, u.username as customer_name 
                 FROM orders o 
                 JOIN users u ON o.user_id = u.id 
                 WHERE o.id = ?`,
        [orderId],
        (err, order) => {
          if (err || !order) {
            reject(err || new Error("Order not found"));
            return;
          }

          // Get order items with product details
          this.db.all(
            `SELECT oi.*, p.name as product_name, p.image_url 
                         FROM order_items oi 
                         JOIN products p ON oi.product_id = p.id 
                         WHERE oi.order_id = ?`,
            [orderId],
            (err, items) => {
              if (err) reject(err);
              else resolve({ ...order, items });
            },
          );
        },
      );
    });
  }

  async getAllOrders() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT o.*, u.username as customer_name,
                 (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count,
                 (SELECT SUM(quantity * price_at_time) FROM order_items WHERE order_id = o.id) as total_amount
                 FROM orders o 
                 JOIN users u ON o.user_id = u.id 
                 ORDER BY o.created_at DESC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        },
      );
    });
  }

  async updateOrderStatus(orderId, status) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "UPDATE orders SET status = ? WHERE id = ?",
        [status, orderId],
        function (err) {
          if (err) reject(err);
          else resolve({ updated: this.changes > 0 });
        },
      );
    });
  }

  // Close database connection
  close() {
    this.db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
      } else {
        console.log("Database connection closed");
      }
    });
  }
}

module.exports = new Database();
