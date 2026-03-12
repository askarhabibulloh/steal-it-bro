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
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
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
// NOTE: Balance is now per-user (in users[username].balance)
// Only coupons count and stock are shared
// ============================================================================
const db = {
  couponCount: 3, // Available DISKON100 coupons
  stock: {
    hp: 8,
    laptop: 8,
  },
};

// Initial state for reset
const initialState = {
  couponCount: 3,
  stock: {
    hp: 8,
    laptop: 8,
  },
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
    balance: 1000,
    itemsShipped: 0,
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
    itemsShipped: user.itemsShipped,
  });
});

// ============================================================================
// VULNERABLE ENDPOINT 1: Transfer (Per-user balance - can demonstrate race condition)
// ============================================================================
app.post("/api/transfer", async (req, res) => {
  const username = verifySession(req);
  if (!username) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  const { amount, recipientUsername } = req.body;

  // Validation
  if (!amount || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  if (!recipientUsername || typeof recipientUsername !== "string") {
    return res.status(400).json({ error: "Recipient username required" });
  }

  if (username === recipientUsername) {
    return res.status(400).json({ error: "Cannot transfer to yourself" });
  }

  const recipient = users[recipientUsername];
  if (!recipient) {
    return res.status(400).json({ error: "Recipient user not found" });
  }

  const sender = users[username];

  // --- START OF VULNERABLE PATTERN ---
  // TOCTOU Vulnerability: Check phase (checking sender's per-user balance)
  if (sender.balance >= amount) {
    console.log(
      `[TRANSFER] ${username} → ${recipientUsername} - Check passed: balance=${sender.balance}, amount=${amount}`,
    );

    // TOCTOU Vulnerability: Intentional delay widens the race window
    await sleep(2000);
    console.log(
      `[TRANSFER] ${username} - After sleep: current balance=${sender.balance}`,
    );

    // Update phase - another thread may have modified balance during sleep!
    sender.balance = sender.balance - amount;
    recipient.balance = recipient.balance + amount;

    console.log(
      `[TRANSFER] ${username} - After update: new balance=${sender.balance}, ${recipientUsername} new balance=${recipient.balance}`,
    );

    return res.json({
      success: true,
      message: `Transfer of $${amount} to ${recipientUsername} successful`,
      senderNewBalance: sender.balance,
      recipientNewBalance: recipient.balance,
      timestamp: new Date().toISOString(),
    });
  } else {
    return res.status(400).json({
      success: false,
      message: "Insufficient funds",
      currentBalance: sender.balance,
      requestedAmount: amount,
    });
  }
  // --- END OF VULNERABLE PATTERN ---
});

// ============================================================================
// INFO ENDPOINT: Get available coupon count
// ============================================================================
app.get("/api/coupons/available", (req, res) => {
  res.json({
    couponCode: "DISKON100",
    availableCount: db.couponCount,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// VULNERABLE ENDPOINT 3: Checkout (Stock Check + Coupon on SHARED STATE)
// ============================================================================
app.post("/api/checkout", async (req, res) => {
  const username = verifySession(req);
  if (!username) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  const { quantity, productType, couponCode } = req.body;
  const user = users[username];

  // Validation
  if (!quantity || typeof quantity !== "number" || quantity <= 0) {
    return res.status(400).json({ error: "Invalid quantity" });
  }

  if (!productType || !["hp", "laptop"].includes(productType.toLowerCase())) {
    return res
      .status(400)
      .json({ error: "Product type must be 'hp' or 'laptop'" });
  }

  const priceMap = {
    hp: 50,
    laptop: 100,
  };

  const pricePerUnit = priceMap[productType.toLowerCase()];
  let totalPrice = quantity * pricePerUnit;
  let appliedCoupon = false;

  // Check if coupon code is DISKON100 and available
  if (couponCode && couponCode.trim().toUpperCase() === "DISKON100") {
    if (db.couponCount > 0) {
      totalPrice = 0; // Coupon makes checkout free
      appliedCoupon = true;
    } else {
      return res.status(400).json({
        success: false,
        message: "Coupon DISKON100 is not available",
        availableCoupons: db.couponCount,
      });
    }
  }

  // Check if user has enough balance (skip if appliedCoupon)
  if (!appliedCoupon && user.balance < totalPrice) {
    return res.status(400).json({
      success: false,
      message: "Insufficient balance",
      userBalance: user.balance,
      requiredAmount: totalPrice,
    });
  }

  // --- START OF VULNERABLE PATTERN ---
  // TOCTOU Vulnerability: Check phase (checking SHARED global stock)
  if (db.stock[productType] >= quantity) {
    console.log(
      `[CHECKOUT] ${username} - Check passed: stock[${productType}]=${db.stock[productType]}, quantity=${quantity}, appliedCoupon=${appliedCoupon}`,
    );

    // TOCTOU Vulnerability: Intentional delay widens the race window
    await sleep(2000);
    console.log(
      `[CHECKOUT] ${username} - After sleep: current stock[${productType}]=${db.stock[productType]}`,
    );

    // Update phase - another thread may have modified stock during sleep!
    db.stock[productType] = db.stock[productType] - quantity;

    // Deduct from user balance (unless coupon was applied)
    if (!appliedCoupon) {
      user.balance = user.balance - totalPrice;
    } else {
      // Decrement coupon count if used
      db.couponCount = db.couponCount - 1;
    }

    // Track items shipped
    user.itemsShipped = user.itemsShipped + quantity;

    console.log(
      `[CHECKOUT] ${username} - After update: new stock[${productType}]=${db.stock[productType]}, userBalance=${user.balance}, couponCount=${db.couponCount}, itemsShipped=${user.itemsShipped}`,
    );

    return res.json({
      success: true,
      message: `Checkout successful`,
      productType: productType,
      quantity: quantity,
      pricePerUnit: pricePerUnit,
      totalPrice: totalPrice,
      appliedCoupon: appliedCoupon,
      userNewBalance: user.balance,
      shippingStatus: "shipped",
      itemCount: quantity,
      newStock: db.stock,
      totalItemsShipped: user.itemsShipped,
      timestamp: new Date().toISOString(),
    });
  } else {
    return res.status(400).json({
      success: false,
      message: "Out of stock",
      currentStock: db.stock[productType],
      requestedQuantity: quantity,
    });
  }
  // --- END OF VULNERABLE PATTERN ---
});

// ============================================================================
// GET Current Shared State + User Balance
// ============================================================================
app.get("/api/status", (req, res) => {
  const username = verifySession(req);
  const userBalance =
    username && users[username] ? users[username].balance : null;
  const itemsShipped =
    username && users[username] ? users[username].itemsShipped : null;

  res.json({
    sharedState: {
      couponCount: db.couponCount,
      stock: db.stock,
    },
    userBalance: userBalance,
    itemsShipped: itemsShipped,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// RESET Endpoint
// ============================================================================
app.post("/api/reset", (req, res) => {
  // Reset shared state
  db.couponCount = initialState.couponCount;
  db.stock = { ...initialState.stock }; // Deep copy stock object

  // Reset all users' balance and items shipped
  Object.keys(users).forEach((username) => {
    users[username].balance = 1000;
    users[username].itemsShipped = 0;
  });

  console.log(
    "[RESET] Lab state reset to initial values (all users, shared state)",
  );

  res.json({
    success: true,
    message: "Lab state has been reset to initial values",
    sharedState: {
      couponCount: db.couponCount,
      stock: db.stock,
    },
    timestamp: new Date().toISOString(),
  });
});

// Health Check
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
║     Race Condition Vulnerability Lab - RUNNING (With Auth)    ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Server: http://localhost:${PORT}                             ║
║  Dashboard: http://localhost:${PORT}/                          ║
║                                                                ║
║  Auth Endpoints:                                               ║
║  - POST /api/auth/signup (Register new user)                 ║
║  - POST /api/auth/login (Login to account)                   ║
║  - POST /api/auth/logout (Logout)                            ║
║  - GET /api/auth/me (Get current user)                       ║
║                                                                ║
║  Vulnerable Endpoints (Race Conditions):                       ║
║  - POST /api/transfer (Per-user balance race condition)       ║
║  - POST /api/checkout (Stock + Coupon race condition)         ║
║  - GET /api/status (View user & shared state)                ║
║  - GET /api/coupons/available (Check coupon count)            ║
║  - POST /api/reset (Reset all state)                          ║
║                                                                ║
║  Initial Shared State:                                         ║
║  - Coupon Count: ${db.couponCount}                                   ║
║  - Stock HP: ${db.stock.hp} units                                    ║
║  - Stock Laptop: ${db.stock.laptop} units                            ║
║  - Per-User Balance: $1000 (each user independent)             ║
║                                                                ║
║  NOTE: Stock is shared across all users (separate by type).   ║
║  This makes race conditions realistic!                        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
