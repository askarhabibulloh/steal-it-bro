const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ============================================================================
// User Authentication System
// ============================================================================
const users = {}; // { username: { password, balance, createdAt } }
const sessions = {}; // { sessionId: { username, createdAt } }

function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

function verifySession(req) {
  const sessionId = req.headers["x-session-id"];
  if (!sessionId || !sessions[sessionId]) {
    return null;
  }
  return sessions[sessionId].username;
}

// ============================================================================
// Global Database - In-memory, vulnerable to race conditions
// Shared resources among ALL users (realistic scenario)
// ============================================================================
const db = {
  balance: 1000,
  coupons: [{ code: "DISKON100", used: false }],
  stock: 5,
};

// Initial state for reset
const initialState = {
  balance: 1000,
  coupons: [{ code: "DISKON100", used: false }],
  stock: 5,
};

// Helper function to create intentional race window
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

// Signup
app.post("/api/auth/signup", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required",
    });
  }

  if (users[username]) {
    return res.status(400).json({
      success: false,
      message: "Username already exists",
    });
  }

  users[username] = {
    password: password,
    balance: db.balance,
    createdAt: new Date().toISOString(),
  };

  const sessionId = generateSessionId();
  sessions[sessionId] = {
    username: username,
    createdAt: new Date().toISOString(),
  };

  console.log(`[AUTH] User registered: ${username}`);

  res.json({
    success: true,
    message: "Signup successful",
    sessionId: sessionId,
    username: username,
  });
});

// Login
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required",
    });
  }

  const user = users[username];
  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      message: "Invalid username or password",
    });
  }

  const sessionId = generateSessionId();
  sessions[sessionId] = {
    username: username,
    createdAt: new Date().toISOString(),
  };

  console.log(`[AUTH] User logged in: ${username}`);

  res.json({
    success: true,
    message: "Login successful",
    sessionId: sessionId,
    username: username,
  });
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  const sessionId = req.headers["x-session-id"];
  if (sessionId && sessions[sessionId]) {
    const username = sessions[sessionId].username;
    delete sessions[sessionId];
    console.log(`[AUTH] User logged out: ${username}`);
  }

  res.json({
    success: true,
    message: "Logout successful",
  });
});

// Get current user
app.get("/api/auth/me", (req, res) => {
  const username = verifySession(req);

  if (!username) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  const user = users[username];
  res.json({
    success: true,
    username: username,
    userBalance: user.balance,
  });
});

// ============================================================================
// VULNERABLE ENDPOINT 1: Transfer (Balance Check on SHARED GLOBAL STATE)
// ============================================================================
app.post("/api/transfer", async (req, res) => {
  const username = verifySession(req);
  if (!username) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  const amount = req.body.amount;

  // Validation
  if (!amount || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  // --- START OF VULNERABLE PATTERN ---
  // TOCTOU Vulnerability: Check phase (checking SHARED global state)
  if (db.balance >= amount) {
    console.log(
      `[TRANSFER] ${username} - Check passed: balance=${db.balance}, amount=${amount}`,
    );

    // TOCTOU Vulnerability: Intentional delay widens the race window
    await sleep(2000);
    console.log(`[TRANSFER] ${username} - After sleep: current balance=${db.balance}`);

    // Update phase - another thread may have modified balance during sleep!
    db.balance = db.balance - amount;
    console.log(
      `[TRANSFER] ${username} - After update: new balance=${db.balance}`,
    );

    return res.json({
      success: true,
      message: `Transfer of $${amount} successful`,
      newBalance: db.balance,
      timestamp: new Date().toISOString(),
    });
  } else {
    return res.status(400).json({
      success: false,
      message: "Insufficient funds",
      currentBalance: db.balance,
      requestedAmount: amount,
    });
  }
  // --- END OF VULNERABLE PATTERN ---
});

// ============================================================================
// VULNERABLE ENDPOINT 2: Coupon Usage (Single-Use Check on SHARED STATE)
// ============================================================================
app.post("/api/coupon", async (req, res) => {
  const username = verifySession(req);
  if (!username) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  const discountPercentage = 20; // 20% discount

  // --- START OF VULNERABLE PATTERN ---
  // TOCTOU Vulnerability: Check phase (checking SHARED global coupon)
  if (db.coupons[0] && db.coupons[0].used === false) {
    console.log(`[COUPON] ${username} - Check passed: coupon unused`);

    // TOCTOU Vulnerability: Intentional delay widens the race window
    await sleep(2000);
    console.log(`[COUPON] ${username} - After sleep: coupon.used=${db.coupons[0].used}`);

    // Update phase - another thread may have marked coupon as used during sleep!
    db.coupons[0].used = true;
    const discount = (db.balance * discountPercentage) / 100;
    db.balance = db.balance - discount;

    console.log(
      `[COUPON] ${username} - After update: coupon.used=${db.coupons[0].used}, discount=$${discount}, newBalance=${db.balance}`,
    );

    return res.json({
      success: true,
      message: `Coupon DISKON100 applied successfully`,
      discountPercentage: discountPercentage,
      discountAmount: discount.toFixed(2),
      newBalance: db.balance.toFixed(2),
      timestamp: new Date().toISOString(),
    });
  } else {
    return res.status(400).json({
      success: false,
      message: "Coupon already used or not available",
      couponStatus: db.coupons[0] ? db.coupons[0].used : "not_found",
    });
  }
  // --- END OF VULNERABLE PATTERN ---
});

// ============================================================================
// VULNERABLE ENDPOINT 3: Checkout (Stock Check on SHARED STATE)
// ============================================================================
app.post("/api/checkout", async (req, res) => {
  const username = verifySession(req);
  if (!username) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  const quantity = req.body.quantity || 1;
  const pricePerUnit = 10;

  // Validation
  if (!quantity || typeof quantity !== "number" || quantity <= 0) {
    return res.status(400).json({ error: "Invalid quantity" });
  }

  // --- START OF VULNERABLE PATTERN ---
  // TOCTOU Vulnerability: Check phase (checking SHARED global stock)
  if (db.stock > 0) {
    console.log(
      `[CHECKOUT] ${username} - Check passed: stock=${db.stock}, quantity=${quantity}`,
    );

    // TOCTOU Vulnerability: Intentional delay widens the race window
    await sleep(2000);
    console.log(`[CHECKOUT] ${username} - After sleep: current stock=${db.stock}`);

    // Update phase - another thread may have modified stock during sleep!
    // Note: Still allows going negative (vulnerability!)
    db.stock = db.stock - quantity;
    const totalPrice = quantity * pricePerUnit;

    console.log(
      `[CHECKOUT] ${username} - After update: new stock=${db.stock}, totalPrice=$${totalPrice}`,
    );

    return res.json({
      success: true,
      message: `Checkout successful`,
      quantity: quantity,
      pricePerUnit: pricePerUnit,
      totalPrice: totalPrice,
      newStock: db.stock,
      timestamp: new Date().toISOString(),
    });
  } else {
    return res.status(400).json({
      success: false,
      message: "Out of stock",
      currentStock: db.stock,
      requestedQuantity: quantity,
    });
  }
  // --- END OF VULNERABLE PATTERN ---
});

// ============================================================================
// GET Current Shared State
// ============================================================================
app.get("/api/status", (req, res) => {
  res.json({
    balance: db.balance,
    coupons: db.coupons,
    stock: db.stock,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// RESET Endpoint
// ============================================================================
app.post("/api/reset", (req, res) => {
  // Deep copy initial state
  db.balance = initialState.balance;
  db.coupons = JSON.parse(JSON.stringify(initialState.coupons));
  db.stock = initialState.stock;

  console.log("[RESET] Shared database reset to initial state");

  res.json({
    success: true,
    message: "Lab state has been reset to initial values",
    state: {
      balance: db.balance,
      coupons: db.coupons,
      stock: db.stock,
    },
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Health Check
// ============================================================================
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Race Condition Lab is running" });
});

// ============================================================================
// Server Start
// ============================================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║       Race Condition Vulnerability Lab - RUNNING              ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Server: http://localhost:${PORT}                             ║
║  Dashboard: http://localhost:${PORT}/                          ║
║                                                                ║
║  Vulnerable Endpoints:                                         ║
║  - POST /api/transfer (Balance race condition)                ║
║  - POST /api/coupon (Single-use coupon race condition)        ║
║  - POST /api/checkout (Stock race condition)                  ║
║  - GET /api/status (View current state)                       ║
║  - POST /api/reset (Reset lab state)                          ║
║                                                                ║
║  Initial State:                                                ║
║  - Balance: $${db.balance}                                          ║
║  - Coupon: ${db.coupons[0].code} (Used: ${db.coupons[0].used})          ║
║  - Stock: ${db.stock} units                                        ║
║                                                                ║
║  Education Purpose: Demonstrates TOCTOU vulnerabilities       ║
║  with intentional 2-second delays between check & update      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
