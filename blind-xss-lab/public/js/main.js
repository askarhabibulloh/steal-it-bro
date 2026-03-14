/**
 * ElectroStore Demo - Main JavaScript
 * Core UI behaviors for demo storefront
 */

document.addEventListener("DOMContentLoaded", function () {
  // Initialize cart interactions
  initCartInteractions();

  // Initialize form validations
  initFormValidations();

  // Initialize security warnings
  // security helpers removed for presentation mode

  // Initialize auto-refresh for admin pages
  initAutoRefresh();
});

/**
 * Initialize cart-related interactions
 */
function initCartInteractions() {
  // Cart quantity adjustments
  const quantityInputs = document.querySelectorAll('input[name="quantity"]');
  quantityInputs.forEach((input) => {
    input.addEventListener("change", function () {
      const max = parseInt(this.getAttribute("max")) || 99;
      const min = parseInt(this.getAttribute("min")) || 1;
      let value = parseInt(this.value) || min;

      if (value > max) {
        this.value = max;
        showToast(`Maximum quantity is ${max}`, "warning");
      } else if (value < min) {
        this.value = min;
        showToast(`Minimum quantity is ${min}`, "warning");
      }
    });
  });

  // Cart removal confirmation
  const removeButtons = document.querySelectorAll(
    'form[action*="/cart/remove"]',
  );
  removeButtons.forEach((form) => {
    form.addEventListener("submit", function (e) {
      if (
        !confirm("Are you sure you want to remove this item from your cart?")
      ) {
        e.preventDefault();
      }
    });
  });
}

/**
 * Initialize form validations
 */
function initFormValidations() {
  // Checkout form validation
  const checkoutForm = document.querySelector('form[action="/checkout"]');
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", function (e) {
      const addressField = this.querySelector('textarea[name="address"]');
      const deliveryNotesField = this.querySelector(
        'textarea[name="deliveryNotes"]',
      );

      // Validate address
      if (!addressField.value.trim()) {
        e.preventDefault();
        showToast("Please enter a shipping address", "error");
        addressField.focus();
        return;
      }

      // Security warning for XSS payloads
      if (
        deliveryNotesField.value.includes("<script>") ||
        deliveryNotesField.value.includes("onerror=") ||
        deliveryNotesField.value.includes("onload=")
      ) {
        if (
          !confirm(
            "⚠️ SECURITY WARNING\n\nYou are about to submit an XSS payload.\nThis is for educational purposes only.\n\nClick OK to proceed with the XSS injection.",
          )
        ) {
          e.preventDefault();
          return;
        }

        showToast(
          "XSS payload submitted. Admin bot will review within 60 seconds.",
          "info",
        );
      }
    });
  }

  // Login/Signup form validation
  const authForms = document.querySelectorAll(
    'form[action*="/login"], form[action*="/signup"]',
  );
  authForms.forEach((form) => {
    form.addEventListener("submit", function (e) {
      const usernameField = this.querySelector('input[name="username"]');
      const passwordField = this.querySelector('input[name="password"]');

      if (!usernameField.value.trim() || !passwordField.value.trim()) {
        e.preventDefault();
        showToast("Please fill in all required fields", "error");
      }
    });
  });
}

/**
 * Initialize security warnings and educational content
 */
function initSecurityWarnings() {
  // intentionally left blank for presentation mode
}

/**
 * Initialize auto-refresh for admin pages
 */
function initAutoRefresh() {
  // Check if we're on an admin page
  const isAdminPage = window.location.pathname.includes("/admin/");
  const isDashboard = window.location.pathname === "/admin/dashboard";

  if (isAdminPage) {
    // Add refresh button functionality
    const refreshButtons = document.querySelectorAll(
      'button[onclick*="refresh"], button:contains("Refresh")',
    );
    refreshButtons.forEach((button) => {
      button.addEventListener("click", function () {
        window.location.reload();
      });
    });

    // Auto-refresh dashboard every 30 seconds
    if (isDashboard) {
      setTimeout(() => {
        console.log("Auto-refreshing admin dashboard...");
        window.location.reload();
      }, 30000);
    }
  }
}

// XSS help removed for presentation mode

// payload insertion helpers removed

/**
 * Show toast notification
 */
function showToast(message, type = "info") {
  // Remove existing toasts
  const existingToasts = document.querySelectorAll(".toast-notification");
  existingToasts.forEach((toast) => toast.remove());

  // Create toast
  const toast = document.createElement("div");
  toast.className = `toast-notification toast-${type}`;
  toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

  document.body.appendChild(toast);

  // Show toast
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.remove("show");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }
  }, 5000);
}

/**
 * Get icon for toast type
 */
function getToastIcon(type) {
  switch (type) {
    case "success":
      return "check-circle";
    case "error":
      return "exclamation-circle";
    case "warning":
      return "exclamation-triangle";
    case "info":
    default:
      return "info-circle";
  }
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Add CSS for toast notifications
const toastStyles = document.createElement("style");
toastStyles.textContent = `
.toast-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    padding: 1rem;
    min-width: 300px;
    max-width: 400px;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transform: translateX(400px);
    transition: transform 0.3s ease;
    border-left: 4px solid var(--primary-color);
}

.toast-notification.show {
    transform: translateX(0);
}

.toast-success {
    border-left-color: var(--success-color);
}

.toast-error {
    border-left-color: var(--danger-color);
}

.toast-warning {
    border-left-color: var(--warning-color);
}

.toast-info {
    border-left-color: var(--info-color);
}

.toast-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
}

.toast-content i {
    font-size: 1.25rem;
}

.toast-success .toast-content i {
    color: var(--success-color);
}

.toast-error .toast-content i {
    color: var(--danger-color);
}

.toast-warning .toast-content i {
    color: var(--warning-color);
}

.toast-info .toast-content i {
    color: var(--info-color);
}

.toast-close {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.25rem;
    margin-left: 0.5rem;
}

.toast-close:hover {
    color: var(--dark-color);
}

/* XSS-specific styles removed */
`;
document.head.appendChild(toastStyles);
