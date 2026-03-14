# ElectroStore — Demo Storefront

A self-contained demo storefront for presentations and training. The repository includes example code and demo data to illustrate ordering flows and admin order review processes. Certain implementation details are simplified for demonstration purposes.

## 🎯 Overview

ElectroStore is a simulated electronics e-commerce platform with a deliberate XSS vulnerability. The application allows security students and penetration testers to practice Blind XSS attacks in a safe, controlled environment.

### Key Features

- **Complete E-commerce Simulation**: User registration, product catalog, shopping cart, checkout
- **Demo-focused Examples**: Illustrative code paths for walkthroughs and presentations
- **Admin Bot Automation**: Optional automation to simulate admin reviewing orders
- **Educational Design**: Guidance and notes suitable for internal demos
- **Docker Containerization**: Easy deployment with Docker and Docker Compose

## 🚀 Quick Start

ElectroStore is a simulated electronics e-commerce platform used for presentations and internal demos.

### Prerequisites

- Node.js 18+ (for local development)

```bash
# Clone the repository
git clone <repository-url>
# Build and start the application
docker-compose up --build
# Access the application at http://localhost:3000
```

### Local Development

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
docker build -t electrostore-demo .

### File Structure

```

blind-xss-lab/
├── server.js # Main Express application
docker-compose up
├── bot.js # Admin bot automation script
├── package.json # Dependencies and scripts
├── Dockerfile # Container configuration
├── docker-compose.yml # Docker Compose orchestration
├── sql/
docker-compose logs electrostore-demo
├── views/ # EJS templates
│ ├── layout.ejs # Main layout
│ ├── signup.ejs # User registration
│ ├── login.ejs # User login
│ ├── products.ejs # Product catalog
│ ├── cart.ejs # Shopping cart
│ ├── checkout.ejs # Checkout form
│ ├── order-success.ejs
│ ├── order-history.ejs
│ └── admin/
│ └── css/
│ └── style.css # Application styling
└── README.md # This file

````

docker-compose logs electrostore-demo

This repository contains demo scenarios used during presentations. Explicit exploit examples and step-by-step payload instructions have been removed from this public README to keep the demo focused and suitable for audience-facing use. If you need the demonstration guide (including coordinated payload examples and bot behavior) for a private workshop, request the private demo guide and I will provide it separately.
docker-compose logs -f electrostore-demo
## 👥 User Roles

docker exec electrostore-demo tail -f /app/bot.log

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

## Demo Exercises

Use the demo to walk through the application flow: browse products, add items to cart, checkout, and review orders via the admin interface. For hands-on security demonstrations, coordinate privately so that bot automation and payload testing do not distract the audience.

If you require step-by-step exploit examples and payloads for an internal workshop, request the private demonstration guide.

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
````

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
- **Screenshots**: Saved to `screenshots/` directory

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
