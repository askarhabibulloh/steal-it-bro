const express = require("express");
const fs = require("fs");
const app = express();
const port = 4000;

// Endpoint to simulate a stock check
app.get("/v1/stock/:location", (req, res) => {
  try {
    const stocks = JSON.parse(fs.readFileSync("stock.json", "utf8"));
    const location = req.params.location.toLowerCase();
    const stock = stocks.find((s) => s.location.toLowerCase() === location);
    if (stock) {
      res.json(stock);
    } else {
      res.json({ location: req.params.location, status: "Out of Stock" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to read stock data" });
  }
});

// Admin endpoint with sensitive data
app.get("/v1/admin/config", (req, res) => {
  res.json({
    admin_token: "SSRF_LAB_SUCCESS_PATH_TRAVERSAL",
    internal_status: "Secure",
  });
});

// Data endpoint for host-based SSRF
app.get("/data", (req, res) => {
  res.json({
    message: "You reached the internal data endpoint!",
    flag: "SSRF_LAB_SUCCESS_HOST_BYPASS",
  });
});

// Endpoint to access user data
app.get("/users", (req, res) => {
  try {
    const users = JSON.parse(fs.readFileSync("users.json", "utf8"));
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to read user data" });
  }
});

// Endpoint to simulate cloud metadata
app.get("/metadata", (req, res) => {
  res.json({
    instance_id: "i-1234567890abcdef0",
    ami_id: "ami-0abcdef1234567890",
    region: "us-east-1",
    security_credentials: {
      role: "ssrf-lab-role",
      access_key: "AKIAIOSFODNN7EXAMPLE",
      secret_key: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    },
    flag: "SSRF_LAB_SUCCESS_CLOUD_METADATA",
  });
});

app.listen(port, () => {
  console.log(`Internal API listening at http://localhost:${port}`);
});
