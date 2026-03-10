const express = require("express");
const axios = require("axios");
const app = express();
const port = 3000;

app.use(express.json());

// Route to serve the web UI
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Simple Online Store - SSRF Lab</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        header { background-color: #333; color: white; padding: 10px; text-align: center; }
        .container { max-width: 1200px; margin: 20px auto; padding: 20px; background: white; border-radius: 8px; }
        .product { border: 1px solid #ddd; padding: 10px; margin: 10px 0; display: flex; justify-content: space-between; align-items: center; }
        .product img { width: 100px; height: 100px; object-fit: cover; }
        .product-info { flex: 1; margin-left: 10px; }
        button { padding: 8px 16px; background-color: #28a745; color: white; border: none; cursor: pointer; }
        button:hover { background-color: #218838; }
        #stockForm { margin-top: 20px; padding: 10px; border: 1px solid #ddd; background: #f9f9f9; }
        input { width: 300px; padding: 8px; margin-right: 10px; }
        #result { margin-top: 20px; white-space: pre-wrap; background: #f9f9f9; padding: 10px; border: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <header>
        <h1>Simple Online Store</h1>
        <p>Welcome to our store! Check product stock from suppliers.</p>
      </header>
      <div class="container">
        <h2>Our Products</h2>
        <div class="product">
          <img src="https://placehold.co/100" alt="Product 1">
          <div class="product-info">
            <h3>Laptop</h3>
            <p>High-performance laptop for work and gaming.</p>
            <p>Price: $999</p>
          </div>
          <button onclick="checkStock('http://internal-api:4000/v1/stock/london')">Check Stock</button>
        </div>
        <div class="product">
          <img src="https://placehold.co/100" alt="Product 2">
          <div class="product-info">
            <h3>Smartphone</h3>
            <p>Latest smartphone with advanced features.</p>
            <p>Price: $699</p>
          </div>
          <button onclick="checkStock('http://internal-api:4000/v1/stock/paris')">Check Stock</button>
        </div>
        <div class="product">
          <img src="https://placehold.co/100" alt="Product 3">
          <div class="product-info">
            <h3>Headphones</h3>
            <p>Noise-cancelling wireless headphones.</p>
            <p>Price: $199</p>
          </div>
          <button onclick="checkStock('http://internal-api:4000/v1/stock/berlin')">Check Stock</button>
        </div>
        <div class="product">
          <img src="https://placehold.co/100" alt="Product 4">
          <div class="product-info">
            <h3>Tablet</h3>
            <p>Portable tablet for productivity and entertainment.</p>
            <p>Price: $499</p>
          </div>
          <button onclick="checkStock('http://internal-api:4000/v1/stock/tokyo')">Check Stock</button>
        </div>

        <div id="result"></div>
      </div>

      <script>
        async function checkStock(url) {
          if (!url) {
            document.getElementById('result').textContent = 'Please enter a URL.';
            return;
          }
          try {
            const response = await fetch('/api/stock?url=' + encodeURIComponent(url));
            const data = await response.json();
            document.getElementById('result').textContent = 'Stock Data:\\n' + JSON.stringify(data, null, 2);
          } catch (error) {
            document.getElementById('result').textContent = 'Error: ' + error.message;
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Vulnerable endpoint for checking product stock from a URL
app.get("/api/stock", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "url parameter is required" });
  }

  console.log(`Making request to fetch stock from: ${url}`);

  try {
    const response = await axios.get(url, {
      // Short timeout to prevent long-running requests
      timeout: 2000,
      // Don't follow redirects automatically
      maxRedirects: 0,
    });

    res.json(response.data);
  } catch (error) {
    // The error message might leak info about the internal network
    res
      .status(500)
      .json({ error: "Failed to fetch stock data.", message: error.message });
  }
});

app.listen(port, () => {
  console.log(
    `Web app with stock checking feature listening at http://localhost:${port}`,
  );
});
