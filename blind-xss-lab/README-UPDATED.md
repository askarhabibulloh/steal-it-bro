# ElectroStore — Demo Storefront (Updated)

This file was consolidated into README.md. See [README.md](README.md) for the public-facing demo documentation.

## 🎯 Overview

ElectroStore is a simulated electronics e-commerce platform with a deliberate XSS vulnerability. The application allows security students and penetration testers to practice Blind XSS attacks in a safe, controlled environment.

### Key Features

- **Complete E-commerce Simulation**: User registration, product catalog, shopping cart, checkout
- **Deliberate XSS Vulnerability**: Admin order details page renders delivery notes without sanitization
- **Admin Bot Automation**: Simulates admin reviewing orders every 60 seconds
- **Educational Design**: Clear vulnerability explanations and prevention guidance
- **Docker Containerization**: Easy deployment with Docker and Docker Compose

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (for local development)
- Docker and Docker Compose (for containerized deployment)
- Git

### Using Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd blind-xss-lab

# Build and start the application
docker-compose up --build

# Access the application at http://localhost:3000
```

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd blind-xss-lab

# Install dependencies
npm install

# Install Playwright browsers (required for admin bot)
npx playwright install chromium

# Initialize database
npm run init-db

# Start the application
npm start

# In a separate terminal, start the admin bot
npm run bot

# Access the application at http://localhost:3000
```

## 🏗️ Architecture

### Technology Stack

- **Backend**: Node.js + Express.js
- **Database**: SQLite3 (file-based)
- **Templating**: EJS (with deliberate XSS vulnerability)
- **Authentication**: Express-session
- **Admin Bot**: Playwright (headless Chromium)
- **Containerization**: Docker + Docker Compose
- **Styling**: Pure CSS (no gradients, clean design)

### File Structure

```
blind-xss-lab/
├── server.js              # Main Express application
├── database.js           # Database models and operations
├── bot.js               # Admin bot automation script
├── package.json         # Dependencies and scripts
├── Dockerfile           # Container configuration
├── docker-compose.yml   # Docker Compose orchestration
├── sql/
│   └── schema.sql      # Database schema and seed data
├── scripts/
│   └── init-db.js      # Database initialization script
├── views/              # EJS templates
│   ├── layout.ejs      # Main layout
│   ├── signup.ejs      # User registration
│   ├── login.ejs       # User login
│   ├── products.ejs    # Product catalog
│   ├── cart.ejs        # Shopping cart
│   ├── checkout.ejs    # Checkout form
│   ├── order-success.ejs # Order confirmation
│   ├── order-history.ejs # Order history
│   ├── error.ejs       # Error page
│   └── admin/
│       ├── dashboard.ejs      # Admin order management
│       └── order-details.ejs  # VULNERABLE PAGE
├── public/
│   ├── css/
│   │   └── style.css   # Application styling
│   └── js/
│       └── main.js     # Client-side JavaScript
└── README.md           # This file
```

## 🎯 XSS Vulnerability Details

### Location

The vulnerability is intentionally implemented in `/views/admin/order-details.ejs`:

```ejs
<!-- VULNERABLE: Unescaped output for delivery notes -->
<div class="notes-display">
  <%- order.delivery_notes %>  <!-- DANGEROUS: Allows script execution -->
</div>

<!-- SAFE: Escaped output for address -->
<div class="address-display">
  <%= order.address %>  <!-- SAFE: HTML entities are encoded -->
</div>
```

### Attack Flow

1. **Attacker creates account** and places an order
2. **Inject XSS payload** in "Delivery Notes" field during checkout
3. **Admin bot automatically views** the order every 60 seconds
4. **Payload executes** in admin context (steals cookies, performs actions, etc.)
5. **Attacker receives data** from executed payload

### Sample Payloads

```html
<!-- Basic alert -->
<script>
  alert("XSS");
</script>

<!-- Image-based XSS -->
<img src="x" onerror="alert('XSS')" />

<!-- SVG-based XSS -->
<svg onload="alert('XSS')"></svg>
```

## 👥 User Roles

### Regular Customer

- **Credentials**: Create your own account via Sign Up
- **Permissions**:
  - Browse products
  - Add items to cart
  - Place orders
  - View order history
- **Goal**: Inject XSS payloads in delivery notes

### Administrator

- **Credentials**: `admin` / `admin`
- **Permissions**:
  - View all orders
  - Update order status
  - View order details (vulnerable page)
- **Goal**: Review orders (simulated by admin bot)

### Admin Bot

- **Automation**: Runs every 60 seconds
- **Behavior**:
  - Logs in as admin
  - Views all "Created" orders
  - Waits 5 seconds per order (triggers XSS)
  - Logs out
- **Purpose**: Simulates real admin reviewing orders

## 🧪 Lab Exercises

### Exercise 1: Basic XSS Detection

1. Create a customer account
2. Add products to cart and checkout
3. Inject `<!-- <script>alert('XSS')</script> -->` in delivery notes
4. Wait for admin bot to view order
5. Verify payload execution (check bot logs)

### Exercise 2: Advanced Payloads

1. Experiment with different XSS vectors:
   - `<img src=x onerror="alert(1)">`
   - `<svg onload="alert(1)">`
   - `<body onload="alert(1)">`
2. Test payload obfuscation techniques
3. Try DOM-based XSS variations

### Exercise 3: Vulnerability Analysis

1. Examine the vulnerable code in `views/admin/order-details.ejs`
2. Compare `<%- %>` vs `<%= %>` output methods
3. Propose secure alternatives
4. Implement Content Security Policy (CSP) headers

## 🔒 Security Considerations

### Deliberate Vulnerabilities

This application contains **intentional security vulnerabilities** for educational purposes:

- XSS in admin order details page
- No input validation on delivery notes
- No output encoding on vulnerable page

### DO NOT USE IN PRODUCTION

This application is **NOT SECURE** and should only be used in:

- Controlled lab environments
- Security training sessions
- Educational demonstrations

### Safe Usage Guidelines

1. **Isolate the environment** (use Docker/VMs)
2. **Do not use real credentials**
3. **Monitor network traffic**
4. **Keep the application offline** when not in use
5. **Educate users** about the intentional vulnerabilities

## 🐳 Docker Deployment

### Building the Image

```bash
docker build -t blind-xss-lab .
```

### Running with Docker Compose

```bash
# Start the application
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down

# Rebuild and restart
docker-compose up --build
```

### Environment Variables

- `PORT`: Application port (default: 3000)
- `APP_URL`: Base URL for the application (default: http://localhost:3000)
- `NODE_ENV`: Environment mode (default: production)

## 📊 Monitoring and Logs

### Application Logs

- **Server logs**: Output to console
- **Database logs**: SQLite operations
- **Session logs**: User authentication events

### Admin Bot Logs

- **Location**: `bot.log` in application directory
- **Content**: Bot activities, order views, errors
- **Screenshots**: Saved to application directory

### Docker Logs

```bash
# View application logs
docker-compose logs blind-xss-lab

# View real-time logs
docker-compose logs -f blind-xss-lab

# View bot-specific logs
docker exec electrostore-blind-xss tail -f /app/bot.log
```

## 🛠️ Troubleshooting

### Common Issues

#### Database Issues

```bash
# Reset the database
rm database.sqlite
npm run init-db
```

#### Admin Bot Not Running

```bash
# Check bot logs
cat bot.log

# Manually start the bot
node bot.js

# Check Playwright installation
npx playwright install chromium
```

#### Docker Issues

```bash
# Clean Docker resources
docker-compose down -v
docker system prune -a

# Rebuild from scratch
docker-compose up --build
```

#### Port Already in Use

```bash
# Change port in docker-compose.yml
ports:
  - "3001:3000"

# Or kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## 📚 Educational Resources

### XSS Prevention

1. **Output Encoding**: Always use `<%= %>` instead of `<%- %>` in EJS
2. **Input Validation**: Validate and sanitize user input
3. **Content Security Policy**: Implement CSP headers
4. **HTTP-only Cookies**: Prevent cookie theft via JavaScript
5. **Regular Security Testing**: Conduct penetration tests

### Further Learning

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [PortSwigger XSS Labs](https://portswigger.net/web-security/cross-site-scripting)
- [MDN Web Security Guide](https://developer.mozilla.org/en-US/docs/Web/Security)

## 🤝 Contributing

This project is designed for educational purposes. Contributions that enhance the learning experience are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Suggested Improvements

- Additional vulnerability types (SQLi, CSRF, etc.)
- Enhanced educational materials
- More realistic e-commerce features
- Improved bot simulation
- Additional attack scenarios

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

**WARNING**: This application contains intentional security vulnerabilities for educational purposes only. Do not deploy in production environments. The authors are not responsible for any misuse of this software.

## 🙏 Acknowledgments

- Inspired by real-world XSS vulnerabilities in e-commerce platforms
- Built for security education and penetration testing training
- Special thanks to the security community for feedback and testing

---

**Happy Hacking (Responsibly)!** 🛡️

## 🔧 Recent Fixes (March 2026)

The following issues have been fixed in this version:

### Critical Fixes:

1. **Fixed EJS template syntax errors** in `products.ejs` and `admin/dashboard.ejs`
   - Changed `<%- delivery_notes %>` to `<%%- delivery_notes %>` in educational text
   - Server no longer crashes when rendering products page

2. **Created missing view templates**:
   - `views/checkout.ejs` - Checkout form with XSS injection point
   - `views/order-success.ejs` - Order confirmation page
   - `views/order-history.ejs` - User order history

3. **Created missing JavaScript file**:
   - `public/js/main.js` - Client-side functionality with XSS training helpers

4. **Created database initialization script**:
   - `scripts/init-db.js` - Manual database setup with interactive prompts

5. **Fixed admin bot login issues**:
   - Increased timeout from 10s to 15s
   - Added flexible login detection (page title check)
   - Bot now successfully logs in and navigates

### Preserved Intentional Vulnerabilities:

- **XSS vulnerability remains intact** in `views/admin/order-details.ejs`
- Delivery notes still render with `<%- order.delivery_notes %>` (unescaped)
- The core educational purpose is preserved

### Testing Results:

- ✅ Server starts without errors
- ✅ All routes render correctly (no 404 errors)
- ✅ Admin bot successfully logs in and runs
- ✅ XSS vulnerability demonstration works as intended
- ✅ Database initializes properly with seed data

The application is now fully functional for security training purposes.
