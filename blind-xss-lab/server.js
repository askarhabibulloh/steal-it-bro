const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Session configuration
app.use(
  session({
    secret: "blind-xss-lab-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware to make user data available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.cart = req.session.cart || [];
  next();
});

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).render("error", {
      message: "Access denied. Admin privileges required.",
    });
  }
  next();
};

// Routes

// Home page - redirect to products
app.get("/", (req, res) => {
  res.redirect("/products");
});

// Authentication routes
app.get("/signup", (req, res) => {
  if (req.session.user) {
    return res.redirect("/products");
  }
  res.render("signup", { error: null });
});

app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.render("signup", {
        error: "Username and password are required",
      });
    }

    // Check if user exists
    const existingUser = await db.getUserByUsername(username);
    if (existingUser) {
      return res.render("signup", {
        error: "Username already exists",
      });
    }

    // Create user
    const user = await db.createUser(username, password);

    // Auto-login after signup
    req.session.user = {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
    };

    res.redirect("/products");
  } catch (error) {
    console.error("Signup error:", error);
    res.render("signup", {
      error: "An error occurred during signup",
    });
  }
});

app.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/products");
  }
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.render("login", {
        error: "Username and password are required",
      });
    }

    const user = await db.verifyUser(username, password);

    if (!user) {
      return res.render("login", {
        error: "Invalid username or password",
      });
    }

    req.session.user = user;
    res.redirect("/products");
  } catch (error) {
    console.error("Login error:", error);
    res.render("login", {
      error: "An error occurred during login",
    });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// Product catalog
app.get("/products", async (req, res) => {
  try {
    const products = await db.getAllProducts();
    res.render("products", { products });
  } catch (error) {
    console.error("Products error:", error);
    res.render("error", {
      message: "Failed to load products",
    });
  }
});

// Cart management
app.post("/cart/add", requireAuth, (req, res) => {
  const { productId, quantity } = req.body;

  if (!req.session.cart) {
    req.session.cart = [];
  }

  // Check if product already in cart
  const existingIndex = req.session.cart.findIndex(
    (item) => item.productId === parseInt(productId),
  );

  if (existingIndex >= 0) {
    req.session.cart[existingIndex].quantity += parseInt(quantity);
  } else {
    req.session.cart.push({
      productId: parseInt(productId),
      quantity: parseInt(quantity),
    });
  }

  res.redirect("/cart");
});

app.get("/cart", requireAuth, async (req, res) => {
  try {
    const cartItems = [];
    let total = 0;

    // Ensure cart exists and is iterable
    const cart = req.session.cart || [];

    for (const item of cart) {
      const product = await db.getProductById(item.productId);
      if (product) {
        const itemTotal = product.price * item.quantity;
        cartItems.push({
          ...product,
          quantity: item.quantity,
          itemTotal,
        });
        total += itemTotal;
      }
    }

    res.render("cart", { cartItems, total });
  } catch (error) {
    console.error("Cart error:", error);
    res.render("error", {
      message: "Failed to load cart",
    });
  }
});

app.post("/cart/remove", requireAuth, (req, res) => {
  const { productId } = req.body;

  if (req.session.cart) {
    req.session.cart = req.session.cart.filter(
      (item) => item.productId !== parseInt(productId),
    );
  }

  res.redirect("/cart");
});

app.post("/cart/update", requireAuth, (req, res) => {
  const { productId, quantity } = req.body;

  if (req.session.cart) {
    const itemIndex = req.session.cart.findIndex(
      (item) => item.productId === parseInt(productId),
    );

    if (itemIndex >= 0) {
      const newQuantity = parseInt(quantity);
      if (newQuantity > 0) {
        req.session.cart[itemIndex].quantity = newQuantity;
      } else {
        // Remove if quantity is 0 or negative
        req.session.cart.splice(itemIndex, 1);
      }
    }
  }

  res.redirect("/cart");
});

// Checkout
app.get("/checkout", requireAuth, async (req, res) => {
  try {
    if (!req.session.cart || req.session.cart.length === 0) {
      return res.redirect("/cart");
    }

    const cartItems = [];
    let total = 0;

    for (const item of req.session.cart) {
      const product = await db.getProductById(item.productId);
      if (product) {
        const itemTotal = product.price * item.quantity;
        cartItems.push({
          ...product,
          quantity: item.quantity,
          itemTotal,
        });
        total += itemTotal;
      }
    }

    res.render("checkout", { cartItems, total });
  } catch (error) {
    console.error("Checkout error:", error);
    res.render("error", {
      message: "Failed to load checkout",
    });
  }
});

app.post("/checkout", requireAuth, async (req, res) => {
  try {
    const { address, deliveryNotes } = req.body;

    if (!address || !req.session.cart || req.session.cart.length === 0) {
      return res.redirect("/cart");
    }

    // Get product prices for cart items
    const cartItems = [];
    for (const item of req.session.cart) {
      const product = await db.getProductById(item.productId);
      if (product) {
        cartItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
        });
      }
    }

    if (cartItems.length === 0) {
      return res.redirect("/cart");
    }

    // Create order
    const order = await db.createOrder(
      req.session.user.id,
      address,
      deliveryNotes || "",
      cartItems,
    );

    // Clear cart
    req.session.cart = [];

    res.render("order-success", { orderId: order.orderId });
  } catch (error) {
    console.error("Checkout error:", error);
    res.render("error", {
      message: "Failed to process order",
    });
  }
});

// Order history
app.get("/history", requireAuth, async (req, res) => {
  try {
    const orders = await db.getOrdersByUserId(req.session.user.id);
    res.render("order-history", { orders });
  } catch (error) {
    console.error("History error:", error);
    res.render("error", {
      message: "Failed to load order history",
    });
  }
});

// Admin routes
app.get("/admin/dashboard", requireAuth, requireAdmin, async (req, res) => {
  try {
    const orders = await db.getAllOrders();
    res.render("admin/dashboard", { orders });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.render("error", {
      message: "Failed to load admin dashboard",
    });
  }
});

// VULNERABLE PAGE: Admin order details (XSS vulnerability here)
app.get("/admin/order/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await db.getOrderById(orderId);

    if (!order) {
      return res.status(404).render("error", {
        message: "Order not found",
      });
    }

    // CRITICAL VULNERABILITY: Using <%- %> to render user input without escaping
    // This allows XSS payloads in delivery_notes to execute
    res.render("admin/order-details", { order });
  } catch (error) {
    console.error("Order details error:", error);
    res.render("error", {
      message: "Failed to load order details",
    });
  }
});

app.post(
  "/admin/order/:id/status",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;

      const validStatuses = ["Created", "Processing", "Shipped"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const result = await db.updateOrderStatus(orderId, status);

      if (result.updated) {
        res.redirect(`/admin/order/${orderId}`);
      } else {
        res.status(404).json({ error: "Order not found" });
      }
    } catch (error) {
      console.error("Status update error:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  },
);

// Error handling
app.use((req, res) => {
  res.status(404).render("error", {
    message: "Page not found",
  });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).render("error", {
    message: "Internal server error",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`ElectroStore server running on http://localhost:${PORT}`);
  console.log("Admin credentials: admin / admin");
  console.log("XSS Vulnerability: Delivery notes in admin order details page");
});
