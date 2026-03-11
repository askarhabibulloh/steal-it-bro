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

// Route to serve the v2 web UI with auto-checking stock
app.get("/v2", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Simple Online Store V2 - SSRF Lab</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        header { background-color: #333; color: white; padding: 10px; text-align: center; }
        .container { max-width: 1200px; margin: 20px auto; padding: 20px; background: white; border-radius: 8px; }
        .products { margin-bottom: 20px; }
        .product { border: 1px solid #ddd; padding: 15px; margin: 15px 0; background: #fafafa; border-radius: 5px; }
        .product-header { display: flex; gap: 15px; align-items: flex-start; }
        .product img { width: 100px; height: 100px; object-fit: cover; border-radius: 4px; }
        .product-info { flex: 1; }
        .product-info h3 { margin: 0 0 8px 0; color: #333; }
        .product-info p { margin: 5px 0; color: #666; font-size: 14px; }
        .product-price { font-weight: bold; color: #28a745; margin-top: 8px; }
        .stock-info { margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd; }
        .stock-info-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .stock-status { display: inline-block; padding: 6px 12px; border-radius: 4px; font-weight: bold; margin-top: 6px; }
        .stock-status.loading { background-color: #e9ecef; color: #666; }
        .in-stock { background-color: #d4edda; color: #155724; }
        .out-of-stock { background-color: #f8d7da; color: #721c24; }
        .stock-quantity { margin-top: 6px; font-size: 14px; color: #555; }
        .error { background-color: #f8d7da; color: #721c24; padding: 8px 12px; border-radius: 4px; margin-top: 6px; }
      </style>
    </head>
    <body>
      <header>
        <h1>Simple Online Store V2</h1>
        <p>Next-generation store with automatic stock checking from multiple locations.</p>
      </header>
      <div class="container">
        <h2>Our Products</h2>
        <div class="products">
          <div class="product" data-location="london">
            <div class="product-header">
              <img src="https://placehold.co/100" alt="Laptop">
              <div class="product-info">
                <h3>Laptop</h3>
                <p>High-performance laptop for work and gaming.</p>
                <div class="product-price">Price: \$999</div>
                <div class="stock-info">
                  <div class="stock-info-label">Warehouse: London</div>
                  <div class="stock-status loading">Loading...</div>
                  <div class="stock-quantity"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="product" data-location="paris">
            <div class="product-header">
              <img src="https://placehold.co/100" alt="Smartphone">
              <div class="product-info">
                <h3>Smartphone</h3>
                <p>Latest smartphone with advanced features.</p>
                <div class="product-price">Price: \$699</div>
                <div class="stock-info">
                  <div class="stock-info-label">Warehouse: Paris</div>
                  <div class="stock-status loading">Loading...</div>
                  <div class="stock-quantity"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="product" data-location="berlin">
            <div class="product-header">
              <img src="https://placehold.co/100" alt="Headphones">
              <div class="product-info">
                <h3>Headphones</h3>
                <p>Noise-cancelling wireless headphones.</p>
                <div class="product-price">Price: \$199</div>
                <div class="stock-info">
                  <div class="stock-info-label">Warehouse: Berlin</div>
                  <div class="stock-status loading">Loading...</div>
                  <div class="stock-quantity"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="product" data-location="tokyo">
            <div class="product-header">
              <img src="https://placehold.co/100" alt="Tablet">
              <div class="product-info">
                <h3>Tablet</h3>
                <p>Portable tablet for productivity and entertainment.</p>
                <div class="product-price">Price: \$499</div>
                <div class="stock-info">
                  <div class="stock-info-label">Warehouse: Tokyo</div>
                  <div class="stock-status loading">Loading...</div>
                  <div class="stock-quantity"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <script>
        async function checkStockV2() {
          const locations = ['london', 'paris', 'berlin', 'tokyo'];

          try {
            // Parallel fetch to all 4 locations
            const promises = locations.map(location =>
              fetch('/api/stock?url=' + encodeURIComponent('http://internal-api:4000/v1/stock/' + location))
                .then(response => response.json())
                .then(data => ({
                  location: location,
                  status: data.status,
                  quantity: data.quantity || 0,
                  error: null
                }))
                .catch(error => ({
                  location: location,
                  error: error.message
                }))
            );

            const results = await Promise.all(promises);

            // Populate each product with its stock info
            results.forEach(result => {
              const productDiv = document.querySelector(\`[data-location="\${result.location}"]\`);
              if (!productDiv) return;

              const stockStatus = productDiv.querySelector('.stock-status');
              const stockQuantity = productDiv.querySelector('.stock-quantity');

              if (result.error) {
                stockStatus.classList.remove('loading');
                stockStatus.classList.add('error');
                stockStatus.textContent = 'Error: ' + result.error;
                stockQuantity.innerHTML = '';
              } else {
                const statusClass = result.status === 'In Stock' ? 'in-stock' : 'out-of-stock';
                stockStatus.classList.remove('loading');
                stockStatus.classList.add(statusClass);
                stockStatus.textContent = result.status;
                stockQuantity.textContent = result.quantity + ' units available';
              }
            });

          } catch (error) {
            console.error('Failed to load stock information:', error.message);
          }
        }

        // Auto-check stock when page loads
        window.addEventListener('load', checkStockV2);
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
