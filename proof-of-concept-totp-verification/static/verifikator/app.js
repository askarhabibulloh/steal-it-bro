/* ── State ── */
let scanner = null;
let isScanning = false;
let historyEntries = [];
const MAX_HISTORY = 10;
const STORAGE_SERVER_KEY = "totp_verifier_server";

/* ── DOM refs ── */
const serverUrlInput = document.getElementById("serverUrl");
const statusEl = document.getElementById("status");
const statusIcon = statusEl.querySelector(".status-icon");
const statusText = statusEl.querySelector(".status-text");
const resultEl = document.getElementById("result");
const resultIcon = document.getElementById("resultIcon");
const resultTitle = document.getElementById("resultTitle");
const resultDetail = document.getElementById("resultDetail");
const historyEl = document.getElementById("history");
const historyList = document.getElementById("historyList");
const resetBtn = document.getElementById("resetBtn");
const startCameraBtn = document.getElementById("startCameraBtn");

/* ── Server URL ── */
function getServerUrl() {
  let url = serverUrlInput.value.trim();
  if (!url) url = "";
  // Remove trailing slash
  return url.replace(/\/+$/, "");
}

function saveServerUrl() {
  localStorage.setItem(STORAGE_SERVER_KEY, serverUrlInput.value.trim());
}

function loadServerUrl() {
  const saved = localStorage.getItem(STORAGE_SERVER_KEY);
  if (saved) serverUrlInput.value = saved;
}

/* ── Status updates ── */
function setStatus(icon, text, isError = false) {
  statusIcon.textContent = icon;
  statusText.textContent = text;
  statusText.style.color = isError ? "#ff6b6b" : "rgba(255,255,255,0.6)";
}

/* ── Result display ── */
function showResult(valid, userId, message) {
  resultEl.style.display = "block";
  resultEl.className = `result ${valid ? "valid" : "invalid"}`;
  resultIcon.textContent = valid ? "✅" : "❌";
  resultTitle.textContent = valid ? "VERIFIED" : "INVALID";
  resultDetail.textContent = valid
    ? `User: ${userId} — ${message}`
    : message || "Verification failed";
}

function hideResult() {
  resultEl.style.display = "none";
}

/* ── History ── */
function addHistory(valid, userId, timestamp) {
  historyEntries.unshift({ valid, userId, timestamp });
  if (historyEntries.length > MAX_HISTORY) historyEntries.pop();
  renderHistory();
}

function renderHistory() {
  if (historyEntries.length === 0) {
    historyEl.style.display = "none";
    return;
  }
  historyEl.style.display = "block";
  historyList.innerHTML = historyEntries
    .map(
      (entry) => `
            <div class="history-item">
                <span class="h-status">${entry.valid ? "✅" : "❌"}</span>
                <span class="h-user">${entry.userId}</span>
                <span class="h-time">${entry.timestamp}</span>
            </div>`,
    )
    .join("");
}

/* ── Verify with server ── */
async function verifyWithServer(userId, hash) {
  const serverUrl = getServerUrl();
  const url = `${serverUrl}/api/verify`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, hash }),
    });
    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    return { valid: false, message: `Network error: ${err.message}` };
  }
}

/* ── QR scan handler ── */
async function onScanSuccess(decodedText) {
  if (!isScanning) return;
  isScanning = false;

  // Pause scanner
  try {
    await scanner.pause();
  } catch (e) {
    /* ignore */
  }

  setStatus("🔍", "Processing QR code...");

  // Parse QR: expected format "userId:hash"
  const parts = decodedText.split(":");
  if (parts.length < 2) {
    setStatus("⚠️", "Invalid QR format", true);
    showResult(false, "-", "Invalid QR format. Expected userId:hash");
    resetBtn.classList.remove("hidden");
    return;
  }

  const userId = parts[0];
  const hash = parts.slice(1).join(":");

  setStatus("📡", "Verifying with server...");

  const result = await verifyWithServer(userId, hash);

  if (result.valid) {
    setStatus("✅", "Verification successful");
  } else {
    setStatus("❌", result.message || "Verification failed", true);
  }

  showResult(result.valid, userId, result.message || "");

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  addHistory(result.valid, userId, timeStr);

  resetBtn.classList.remove("hidden");
}

/* ── Scanner control via user gesture ── */
async function startScanner() {
  hideResult();
  resetBtn.classList.add("hidden");
  startCameraBtn.classList.add("hidden");
  setStatus("📷", "Starting camera...");

  if (scanner) {
    try {
      await scanner.clear();
    } catch (e) {
      /* ignore */
    }
  }

  saveServerUrl();
  scanner = new Html5Qrcode("scanner");

  try {
    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
      onScanSuccess,
      () => {
        /* ignore non-QR frames */
      },
    );
    isScanning = true;
    setStatus("📷", "Point camera at QR code");
  } catch (err) {
    setStatus("⚠️", `Camera error: ${err.message}`, true);
    console.error("Camera error:", err);
    resetBtn.classList.remove("hidden");
    startCameraBtn.classList.remove("hidden");
  }
}

/* ── Buttons ── */
startCameraBtn.addEventListener("click", startScanner);

resetBtn.addEventListener("click", () => {
  startScanner();
});

/* ── Init ── */
loadServerUrl();
