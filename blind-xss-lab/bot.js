#!/usr/bin/env node

/**
 * Admin Bot for Blind XSS Lab
 *
 * This bot simulates an admin user who periodically reviews orders.
 * It automatically logs in as admin, views new orders, and triggers any XSS payloads
 * that have been injected into delivery notes.
 *
 * The bot runs every 60 seconds to simulate real admin behavior.
 */

const { chromium } = require("playwright");
const fs = require("fs").promises;
const path = require("path");

// Configuration
const CONFIG = {
  baseUrl: process.env.APP_URL || "http://localhost:3000",
  adminCredentials: {
    username: "admin",
    password: "admin",
  },
  interval: 60 * 1000, // 60 seconds
  viewDelay: 5000, // 5 seconds per order
  headless: true,
  logFile: path.join(__dirname, "bot.log"),
  maxOrdersPerRun: 10, // Limit to prevent infinite loops
};

class AdminBot {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.runCount = 0;
    this.lastRun = null;
  }

  async log(message, level = "INFO") {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    console.log(logMessage);

    try {
      await fs.appendFile(CONFIG.logFile, logMessage + "\n");
    } catch (error) {
      console.error(`Failed to write to log file: ${error.message}`);
    }
  }

  async initialize() {
    try {
      this.log("Initializing admin bot...");

      this.browser = await chromium.launch({
        headless: CONFIG.headless,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      this.context = await this.browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      });

      this.page = await this.context.newPage();

      this.log("Bot initialized successfully");
      return true;
    } catch (error) {
      this.log(`Failed to initialize bot: ${error.message}`, "ERROR");
      return false;
    }
  }

  async login() {
    try {
      this.log(`Navigating to login page: ${CONFIG.baseUrl}/login`);
      await this.page.goto(`${CONFIG.baseUrl}/login`, {
        waitUntil: "networkidle",
      });

      // Fill login form
      await this.page.fill(
        'input[name="username"]',
        CONFIG.adminCredentials.username,
      );
      await this.page.fill(
        'input[name="password"]',
        CONFIG.adminCredentials.password,
      );

      // Submit form
      await this.page.click('button[type="submit"]');

      // Wait for navigation to complete - increased timeout and more flexible check
      try {
        await this.page.waitForURL(`${CONFIG.baseUrl}/products`, {
          timeout: 15000,
        });
      } catch (error) {
        // Check if we're already on products page
        const currentUrl = this.page.url();
        if (currentUrl.includes("/products")) {
          this.log("Already on products page");
          return true;
        }

        // Check for any successful login indicator
        const pageTitle = await this.page.title();
        if (pageTitle.includes("ElectroStore")) {
          this.log("Login successful (detected by page title)");
          return true;
        }

        throw new Error(
          `Login failed - not redirected to expected page. Current URL: ${currentUrl}, Title: ${pageTitle}`,
        );
      }

      // Verify login success
      const pageTitle = await this.page.title();
      if (pageTitle.includes("ElectroStore")) {
        this.log("Login successful");
        return true;
      } else {
        throw new Error("Login failed - not redirected to expected page");
      }
    } catch (error) {
      this.log(`Login failed: ${error.message}`, "ERROR");

      // Take screenshot for debugging
      const screenshotPath = path.join(__dirname, "login-error.png");
      await this.page.screenshot({ path: screenshotPath });
      this.log(`Screenshot saved to: ${screenshotPath}`, "DEBUG");

      return false;
    }
  }

  async getPendingOrders() {
    try {
      this.log("Navigating to admin dashboard...");
      await this.page.goto(`${CONFIG.baseUrl}/admin/dashboard`, {
        waitUntil: "networkidle",
      });

      // Wait for orders table to load
      await this.page.waitForSelector("table.table", { timeout: 10000 });

      // Extract order data from table
      const orders = await this.page.evaluate(() => {
        const rows = Array.from(
          document.querySelectorAll("table.table tbody tr"),
        );
        return rows
          .map((row) => {
            const cells = row.querySelectorAll("td");
            return {
              id: cells[0]?.textContent?.replace("#", "").trim() || "",
              customer: cells[1]?.textContent?.trim() || "",
              status:
                cells[4]?.querySelector(".status-badge")?.textContent?.trim() ||
                "",
              viewUrl:
                cells[6]
                  ?.querySelector('a[href*="/admin/order/"]')
                  ?.getAttribute("href") || "",
            };
          })
          .filter(
            (order) => order.id && order.viewUrl && order.status === "Created",
          );
      });

      this.log(`Found ${orders.length} pending orders with status "Created"`);
      return orders;
    } catch (error) {
      this.log(`Failed to get pending orders: ${error.message}`, "ERROR");
      return [];
    }
  }

  async viewOrder(order) {
    try {
      const orderUrl = `${CONFIG.baseUrl}${order.viewUrl}`;
      this.log(`Viewing order #${order.id}: ${orderUrl}`);

      await this.page.goto(orderUrl, { waitUntil: "networkidle" });

      // Wait for page to load completely
      await this.page.waitForSelector(".order-details-card", {
        timeout: 10000,
      });

      // Check for XSS vulnerability warning
      const hasXssWarning = await this.page.$(".xss-warning");
      if (hasXssWarning) {
        this.log(
          `Order #${order.id} has XSS vulnerability warning (as expected)`,
        );
      }

      // Extract delivery notes for logging
      const deliveryNotes = await this.page.evaluate(() => {
        const notesElement = document.querySelector(".notes-display");
        return notesElement
          ? notesElement.textContent.substring(0, 200) + "..."
          : "No delivery notes";
      });

      this.log(`Order #${order.id} delivery notes preview: ${deliveryNotes}`);

      // Wait specified delay to allow any XSS payloads to execute
      this.log(
        `Waiting ${CONFIG.viewDelay / 1000} seconds for order #${order.id}...`,
      );
      await this.page.waitForTimeout(CONFIG.viewDelay);

      // Take screenshot for documentation
      const screenshotPath = path.join(
        __dirname,
        `order-${order.id}-${Date.now()}.png`,
      );
      await this.page.screenshot({ path: screenshotPath });
      this.log(`Screenshot saved: ${screenshotPath}`, "DEBUG");

      this.log(`Finished viewing order #${order.id}`);
      return true;
    } catch (error) {
      this.log(`Failed to view order #${order.id}: ${error.message}`, "ERROR");
      return false;
    }
  }

  async logout() {
    try {
      this.log("Logging out...");
      await this.page.goto(`${CONFIG.baseUrl}/logout`, {
        waitUntil: "networkidle",
      });

      // Verify logout
      const currentUrl = this.page.url();
      if (currentUrl.includes("/login")) {
        this.log("Logout successful");
        return true;
      } else {
        throw new Error("Logout failed - not redirected to login page");
      }
    } catch (error) {
      this.log(`Logout failed: ${error.message}`, "ERROR");
      return false;
    }
  }

  async run() {
    this.runCount++;
    this.lastRun = new Date();

    this.log(`=== Starting bot run #${this.runCount} ===`);

    try {
      // Initialize browser if not already done
      if (!this.browser) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error("Failed to initialize browser");
        }
      }

      // Login
      const loginSuccess = await this.login();
      if (!loginSuccess) {
        throw new Error("Login failed, aborting run");
      }

      // Get pending orders
      const pendingOrders = await this.getPendingOrders();

      if (pendingOrders.length === 0) {
        this.log("No pending orders to review");
      } else {
        // Limit the number of orders processed per run
        const ordersToProcess = pendingOrders.slice(0, CONFIG.maxOrdersPerRun);
        this.log(
          `Processing ${ordersToProcess.length} orders (limited to ${CONFIG.maxOrdersPerRun} per run)`,
        );

        // View each order
        for (const order of ordersToProcess) {
          await this.viewOrder(order);

          // Go back to dashboard between orders
          await this.page.goto(`${CONFIG.baseUrl}/admin/dashboard`, {
            waitUntil: "networkidle",
          });
        }

        this.log(`Processed ${ordersToProcess.length} orders`);
      }

      // Logout
      await this.logout();

      this.log(`=== Bot run #${this.runCount} completed successfully ===`);
      return true;
    } catch (error) {
      this.log(`Bot run #${this.runCount} failed: ${error.message}`, "ERROR");

      // Try to cleanup on error
      try {
        if (this.page) {
          await this.page.screenshot({
            path: path.join(__dirname, `error-run-${this.runCount}.png`),
          });
        }
      } catch (screenshotError) {
        this.log(
          `Failed to take error screenshot: ${screenshotError.message}`,
          "DEBUG",
        );
      }

      return false;
    }
  }

  async cleanup() {
    this.log("Cleaning up bot resources...");

    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }

      if (this.context) {
        await this.context.close();
        this.context = null;
      }

      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      this.log("Bot resources cleaned up");
    } catch (error) {
      this.log(`Error during cleanup: ${error.message}`, "ERROR");
    }
  }

  async start() {
    this.log("Starting admin bot scheduler...");
    this.log(
      `Configuration: ${JSON.stringify(
        {
          ...CONFIG,
          adminCredentials: { username: "admin", password: "***" }, // Hide password in logs
        },
        null,
        2,
      )}`,
    );

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      this.log("Received SIGINT, shutting down...");
      await this.cleanup();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      this.log("Received SIGTERM, shutting down...");
      await this.cleanup();
      process.exit(0);
    });

    // Initial run
    await this.run();

    // Schedule periodic runs
    const scheduleNextRun = () => {
      const nextRunTime = new Date(Date.now() + CONFIG.interval);
      this.log(`Next run scheduled for: ${nextRunTime.toISOString()}`);

      setTimeout(async () => {
        await this.run();
        scheduleNextRun();
      }, CONFIG.interval);
    };

    scheduleNextRun();
  }
}

// Main execution
if (require.main === module) {
  const bot = new AdminBot();

  // Start the bot
  bot.start().catch((error) => {
    console.error(`Fatal error starting bot: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = AdminBot;
