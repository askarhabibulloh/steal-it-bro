/* ── State ── */
let state = {
  userId: "",
  totpSecret: "",
  salt: "",
};

let qrCodeInstance = null;
let refreshInterval = null;
let totpWindowSeconds = 30;
let secondsUntilRefresh = 0;
let countdownInterval = null;

const STORAGE_KEY = "totp_client_data";
const SETUP_SCREEN = document.getElementById("setupScreen");
const QR_SCREEN = document.getElementById("qrScreen");
const QR_CONTAINER = document.getElementById("qrcode");

/* ── Base32 decode (RFC 4648) ── */
function base32ToBytes(base32) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  base32 = base32.toUpperCase().replace(/=+$/, "");
  let bits = 0,
    value = 0;
  const output = [];
  for (let i = 0; i < base32.length; i++) {
    value = (value << 5) | alphabet.indexOf(base32[i]);
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

/* ── HMAC-SHA1 (Web Crypto) ── */
async function hmacSha1(keyBytes, messageBytes) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, messageBytes);
  return new Uint8Array(sig);
}

/* ── TOTP (RFC 6238) using Web Crypto ── */
async function generateTOTP(secret) {
  try {
    const key = base32ToBytes(secret);
    const counter = Math.floor(Date.now() / 1000 / totpWindowSeconds);
    const counterBuf = new ArrayBuffer(8);
    new DataView(counterBuf).setBigUint64(0, BigInt(counter), false);

    const hmac = await hmacSha1(key, new Uint8Array(counterBuf));
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    return (binary % 1000000).toString().padStart(6, "0");
  } catch (e) {
    console.error("TOTP generation failed:", e);
    return null;
  }
}

/* ── Web Crypto SHA-256 helper ── */
async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ── Generate QR content ── */
async function generateQRContent() {
  const totpCode = await generateTOTP(state.totpSecret);
  if (!totpCode) {
    console.error("Cannot generate TOTP");
    return null;
  }
  const hash = await sha256(state.userId + state.salt + totpCode);
  const content = `${state.userId}:${hash}`;
  return { content, hash };
}

/* ── Refresh QR code ── */
async function refreshQR() {
  if (!state.userId || !state.totpSecret || !state.salt) return;

  const result = await generateQRContent();
  if (!result) return;

  const { content, hash } = result;
  document.getElementById("currentHash").textContent = hash;
  QR_CONTAINER.innerHTML = "";

  qrCodeInstance = new QRCode(QR_CONTAINER, {
    text: content,
    width: 220,
    height: 220,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M,
  });

  secondsUntilRefresh = totpWindowSeconds;
  updateTimer();
}

/* ── Timer / Countdown ── */
function updateTimer() {
  const textEl = document.getElementById("timerText");
  const progressEl = document.getElementById("timerProgress");
  const labelEl = document.querySelector(".timer-label");

  textEl.textContent = secondsUntilRefresh;

  const circumference = 2 * Math.PI * 45;
  const offset = circumference * (1 - secondsUntilRefresh / totpWindowSeconds);
  progressEl.style.strokeDasharray = circumference;
  progressEl.style.strokeDashoffset = offset;

  if (secondsUntilRefresh <= 5) {
    progressEl.style.stroke = "#ff6b6b";
    labelEl.classList.add("warning");
    labelEl.textContent = "Refreshing soon...";
  } else {
    progressEl.style.stroke = "#667eea";
    labelEl.classList.remove("warning");
    labelEl.textContent = "QR refresh in";
  }
}

function startCountdown(initialSeconds) {
  if (countdownInterval) clearInterval(countdownInterval);
  secondsUntilRefresh =
    initialSeconds != null ? initialSeconds : totpWindowSeconds;
  updateTimer();

  countdownInterval = setInterval(() => {
    secondsUntilRefresh--;
    if (secondsUntilRefresh <= 0) {
      secondsUntilRefresh = totpWindowSeconds;
    }
    updateTimer();
  }, 1000);
}

/* ── Refresh loop (sync with TOTP window) ── */
function startRefreshLoop() {
  if (refreshInterval) clearInterval(refreshInterval);

  const now = Math.floor(Date.now() / 1000);
  const offset = now % totpWindowSeconds;
  const msUntilNext = (totpWindowSeconds - offset) * 1000;

  refreshQR().then(() => {
    startCountdown(totpWindowSeconds - offset);
  });

  setTimeout(() => {
    refreshQR().then(() => startCountdown());
    refreshInterval = setInterval(() => {
      refreshQR().then(() => startCountdown());
    }, totpWindowSeconds * 1000);
  }, msUntilNext);
}

/* ── Save / Load state ── */
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.userId && parsed.totpSecret && parsed.salt) {
        state = parsed;
        return true;
      }
    } catch (e) {
      /* ignore */
    }
  }
  return false;
}

/* ── Screen management ── */
function showSetup() {
  SETUP_SCREEN.style.display = "flex";
  QR_SCREEN.style.display = "none";
  if (refreshInterval) clearInterval(refreshInterval);
  if (countdownInterval) clearInterval(countdownInterval);
}

function showQR() {
  SETUP_SCREEN.style.display = "none";
  QR_SCREEN.style.display = "flex";
  document.getElementById("displayUserId").textContent = state.userId;
  startRefreshLoop();
}

/* ── Setup form handler ── */
document.getElementById("setupForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const userId = document.getElementById("userId").value.trim();
  const totpSecret = document.getElementById("totpSecret").value.trim();
  const salt = document.getElementById("salt").value.trim();

  if (!userId || !totpSecret || !salt) {
    alert("Please fill in all fields");
    return;
  }

  state = { userId, totpSecret, salt };
  saveState();
  showQR();
});

/* ── Logout ── */
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  state = { userId: "", totpSecret: "", salt: "" };
  if (refreshInterval) clearInterval(refreshInterval);
  if (countdownInterval) clearInterval(countdownInterval);
  showSetup();
});

/* ── Init ── */
if (loadState()) {
  showQR();
} else {
  showSetup();
}
