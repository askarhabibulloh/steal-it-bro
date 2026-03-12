const API_BASE = "http://localhost:3000";
let currentSessionId = null;
let currentUsername = null;
let autoRefreshInterval = null;

// ============= Auth Functions =============

function switchAuthTab(tab) {
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const tabs = document.querySelectorAll(".tab-button");

  tabs.forEach((t) => t.classList.remove("active"));
  event.target.classList.add("active");

  if (tab === "login") {
    loginForm.style.display = "block";
    signupForm.style.display = "none";
  } else {
    loginForm.style.display = "none";
    signupForm.style.display = "block";
  }
}

async function login() {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;
  const messageDiv = document.getElementById("login-message");

  if (!username || !password) {
    showMessage(messageDiv, "Username and password required", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (data.success) {
      currentSessionId = data.sessionId;
      currentUsername = data.username;
      switchScreen("dashboard");
      updateStatus();
      startAutoRefresh();
      addLog(`✓ Logged in as ${username}`, "success");
    } else {
      showMessage(messageDiv, data.message, "error");
    }
  } catch (err) {
    showMessage(messageDiv, "Error: " + err.message, "error");
  }
}

async function signup() {
  const username = document.getElementById("signup-username").value;
  const password = document.getElementById("signup-password").value;
  const confirm = document.getElementById("signup-confirm").value;
  const messageDiv = document.getElementById("signup-message");

  if (!username || !password || !confirm) {
    showMessage(messageDiv, "All fields required", "error");
    return;
  }

  if (password !== confirm) {
    showMessage(messageDiv, "Passwords do not match", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (data.success) {
      currentSessionId = data.sessionId;
      currentUsername = data.username;
      switchScreen("dashboard");
      updateStatus();
      startAutoRefresh();
      addLog(`✓ Account created & logged in`, "success");
    } else {
      showMessage(messageDiv, data.message, "error");
    }
  } catch (err) {
    showMessage(messageDiv, "Error: " + err.message, "error");
  }
}

async function logout() {
  if (!confirm("Logout?")) return;

  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: { "x-session-id": currentSessionId },
    });

    currentSessionId = null;
    currentUsername = null;
    clearInterval(autoRefreshInterval);
    switchScreen("auth");
    addLog("✓ Logged out", "success");
  } catch (err) {
    addLog("Error logging out: " + err.message, "error");
  }
}

// ============= API Functions =============

async function performTransfer() {
  const recipientUsername = document.getElementById("transfer-recipient").value;
  const amount = parseFloat(document.getElementById("transfer-amount").value);

  if (!recipientUsername || recipientUsername.trim() === "") {
    addLog("❌ Recipient username required", "error");
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    addLog("❌ Invalid amount", "error");
    return;
  }

  addLog(`💸 Transferring $${amount} to ${recipientUsername}...`, "info");

  try {
    const res = await fetch(`${API_BASE}/api/transfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": currentSessionId,
      },
      body: JSON.stringify({ amount, recipientUsername }),
    });

    const data = await res.json();

    if (data.success) {
      addLog(
        `✓ ${data.message} → Your balance: $${data.senderNewBalance}`,
        "success",
      );
      document.getElementById("transfer-recipient").value = "";
      document.getElementById("transfer-amount").value = "100";
    } else {
      addLog(`❌ ${data.message}`, "error");
    }
    updateStatus();
  } catch (err) {
    addLog(`❌ Error: ${err.message}`, "error");
  }
}

async function performCheckout() {
  const productType = document.getElementById("checkout-product").value;
  const quantity = parseInt(document.getElementById("checkout-quantity").value);
  const couponCode = document.getElementById("checkout-coupon").value;

  if (isNaN(quantity) || quantity <= 0) {
    addLog("❌ Invalid quantity", "error");
    return;
  }

  addLog(`📦 Checking out ${quantity} ${productType}(s)...`, "info");

  try {
    const res = await fetch(`${API_BASE}/api/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": currentSessionId,
      },
      body: JSON.stringify({
        quantity,
        productType,
        couponCode: couponCode || undefined,
      }),
    });

    const data = await res.json();

    if (data.success) {
      let couponMsg = data.appliedCoupon
        ? " (Coupon applied - FREE)"
        : `($${data.totalPrice})`;
      addLog(
        `✓ Checkout successful${couponMsg} - Status: ${data.shippingStatus} - Total shipped: ${data.totalItemsShipped} item(s)`,
        "success",
      );
      document.getElementById("checkout-coupon").value = "";
      document.getElementById("checkout-quantity").value = "1";
    } else {
      addLog(`❌ ${data.message}`, "error");
    }
    updateStatus();
  } catch (err) {
    addLog(`❌ Error: ${err.message}`, "error");
  }
}

async function updateStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/status`, {
      headers: { "x-session-id": currentSessionId },
    });
    const data = await res.json();

    // Update shared state
    document.getElementById("state-coupon").textContent =
      data.sharedState.couponCount;
    document.getElementById("coupon-info-count").textContent =
      data.sharedState.couponCount;
    document.getElementById("state-stock-hp").textContent =
      data.sharedState.stock.hp;
    document.getElementById("state-stock-laptop").textContent =
      data.sharedState.stock.laptop;

    // Update user balance
    if (data.userBalance !== null && data.userBalance !== undefined) {
      document.getElementById("current-balance").textContent = data.userBalance;
    }

    // Update items shipped stats
    if (data.itemsShipped !== null && data.itemsShipped !== undefined) {
      document.getElementById("items-shipped-count").textContent =
        data.itemsShipped;
    }
  } catch (err) {
    console.error("Error updating status:", err);
  }
}

async function resetLab() {
  if (!confirm("Reset shared lab state?")) return;

  addLog("🔄 Resetting lab...", "info");

  try {
    const res = await fetch(`${API_BASE}/api/reset`, { method: "POST" });
    const data = await res.json();

    if (data.success) {
      addLog("✓ Lab reset successfully", "success");
      updateStatus();
    } else {
      addLog("❌ Reset failed", "error");
    }
  } catch (err) {
    addLog(`❌ Error: ${err.message}`, "error");
  }
}

// ============= UI Functions =============

function switchScreen(screen) {
  document.querySelectorAll(".auth-screen, .dashboard-screen").forEach((el) => {
    el.classList.remove("active");
  });

  if (screen === "auth") {
    document.querySelector(".auth-screen").classList.add("active");
  } else {
    document.querySelector(".dashboard-screen").classList.add("active");
    document.getElementById("current-username").textContent = currentUsername;
  }
}

function addLog(message, type = "info") {
  const container = document.getElementById("log-container");
  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;
  entry.textContent = message;
  container.appendChild(entry);
  container.scrollTop = container.scrollHeight;
}

function clearLog() {
  const container = document.getElementById("log-container");
  container.innerHTML = '<div class="log-entry info">> Log cleared</div>';
}

function showMessage(element, message, type) {
  element.innerHTML = `<div class="message ${type === "error" ? "error" : ""}">${message}</div>`;
}

function startAutoRefresh() {
  autoRefreshInterval = setInterval(updateStatus, 500);
}

// Test Login
function testLogin() {
  document.getElementById("login-username").value = "user1";
  document.getElementById("login-password").value = "pass1";
  login();
}

// Calculate and update checkout total
function updateCheckoutTotal() {
  const priceMap = { hp: 50, laptop: 100 };
  const productType = document.getElementById("checkout-product").value;
  const quantity =
    parseInt(document.getElementById("checkout-quantity").value) || 1;
  const couponCode = document.getElementById("checkout-coupon").value;

  const pricePerUnit = priceMap[productType] || 50;
  let total = quantity * pricePerUnit;

  // Check if DISKON100 coupon is entered
  if (couponCode.trim().toUpperCase() === "DISKON100") {
    total = 0;
  }

  document.getElementById("checkout-total").textContent = total;
}

// Add event listeners when dashboard is shown
function setupCheckoutListeners() {
  const productSelect = document.getElementById("checkout-product");
  const quantityInput = document.getElementById("checkout-quantity");
  const couponInput = document.getElementById("checkout-coupon");

  if (productSelect)
    productSelect.addEventListener("change", updateCheckoutTotal);
  if (quantityInput)
    quantityInput.addEventListener("input", updateCheckoutTotal);
  if (couponInput) couponInput.addEventListener("input", updateCheckoutTotal);
}

// Initialize on load
document.addEventListener("DOMContentLoaded", setupCheckoutListeners);
