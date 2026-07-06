import hashlib
import io
import os
import base64
import time

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import qrcode
import pyotp

from database import init_db, create_user, get_user, get_all_users

app = Flask(__name__)
CORS(app)


def compute_hash(user_id: str, salt: str, totp_code: str) -> str:
    """SHA-256(user_id + salt + totp_code)"""
    data = user_id + salt + totp_code
    return hashlib.sha256(data.encode()).hexdigest()


def make_setup_qr_base64(otpauth_uri: str) -> str:
    """Generate a QR code PNG and return as base64 data URI."""
    qr = qrcode.make(otpauth_uri)
    buf = io.BytesIO()
    qr.save(buf, format="PNG")
    img_b64 = base64.b64encode(buf.getvalue()).decode()
    return f"data:image/png;base64,{img_b64}"


# ── API Routes ────────────────────────────────────────────────────────────


@app.route("/api/register", methods=["POST"])
def register():
    """Register a new user and return TOTP secret + salt + setup QR."""
    data = request.get_json(silent=True)
    if not data or "username" not in data:
        return jsonify({"error": "username is required"}), 400

    username = data["username"].strip()
    if not username:
        return jsonify({"error": "username cannot be empty"}), 400

    user = create_user(username)
    if user is None:
        return jsonify({"error": "username already exists"}), 409

    # Build otpauth URI for authenticator app
    otpauth_uri = pyotp.totp.TOTP(user["totp_secret"]).provisioning_uri(
        name=username, issuer_name="TOTP Verify PoC"
    )

    setup_qr_b64 = make_setup_qr_base64(otpauth_uri)

    return jsonify({
        "id": user["id"],
        "username": user["username"],
        "totp_secret": user["totp_secret"],
        "salt": user["salt"],
        "setup_uri": otpauth_uri,
        "setup_qr": setup_qr_b64,
    }), 201


@app.route("/api/salt/<user_id>", methods=["GET"])
def get_salt(user_id):
    """Return the unique salt for a user (needed by client to compute hash)."""
    user = get_user(user_id)
    if user is None:
        return jsonify({"error": "user not found"}), 404
    return jsonify({"salt": user["unique_salt"]})


@app.route("/api/verify", methods=["POST"])
def verify():
    """
    Verify a scanned QR code.
    Body: { "userId": "...", "hash": "..." }
    Server recomputes SHA-256(userId+salt+TOTP) and compares.
    Tolerates ±1 TOTP window for clock drift.
    """
    data = request.get_json(silent=True)
    if not data or "userId" not in data or "hash" not in data:
        return jsonify({"error": "userId and hash are required"}), 400

    user_id = data["userId"]
    received_hash = data["hash"]

    user = get_user(user_id)
    if user is None:
        return jsonify({"valid": False, "message": "User not found"}), 200

    salt = user["unique_salt"]
    totp = pyotp.TOTP(user["totp_secret"])

    # Tolerate ±1 window (30s each)
    now = int(time.time())
    for offset in [0, -30, 30]:
        expected_code = totp.at(for_time=now + offset)
        expected_hash = compute_hash(user_id, salt, expected_code)
        if expected_hash == received_hash:
            return jsonify({"valid": True, "message": "Verification successful"}), 200

    return jsonify({"valid": False, "message": "Hash mismatch or TOTP expired"}), 200


@app.route("/api/users", methods=["GET"])
def list_users():
    """List all registered users (no secrets)."""
    users = get_all_users()
    return jsonify({"users": users})


# ── HTML Registration Page (for admin/setup) ─────────────────────────────


@app.route("/register", methods=["GET"])
def register_page():
    """Simple HTML page to register a new user."""
    return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Register User - TOTP PoC</title>
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
           background: #f0f2f5; display: flex; justify-content: center;
           align-items: center; min-height: 100vh; padding: 20px; }
    .card { background: white; border-radius: 16px; padding: 32px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.1); width: 100%; max-width: 480px; }
    h1 { text-align: center; margin-bottom: 24px; color: #1a1a2e; font-size: 24px; }
    .form-group { margin-bottom: 16px; }
    label { display: block; margin-bottom: 6px; font-weight: 600; color: #333; font-size: 14px; }
    input[type="text"] { width: 100%; padding: 12px 16px; border: 2px solid #e0e0e0;
                         border-radius: 8px; font-size: 16px; transition: border-color 0.2s; }
    input[type="text"]:focus { outline: none; border-color: #6c63ff; }
    button { width: 100%; padding: 12px; background: #6c63ff; color: white;
             border: none; border-radius: 8px; font-size: 16px; font-weight: 600;
             cursor: pointer; transition: background 0.2s; }
    button:hover { background: #5a52d5; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .result { margin-top: 24px; display: none; }
    .result.show { display: block; }
    .result h2 { font-size: 18px; margin-bottom: 12px; }
    .result pre { background: #f5f5f5; padding: 12px; border-radius: 8px;
                  font-size: 12px; overflow-x: auto; word-break: break-all;
                  white-space: pre-wrap; max-height: 200px; overflow-y: auto; }
    .secret-box { display: flex; gap: 8px; }
    .secret-box input { flex: 1; }
    .secret-box .copy-btn { width: auto; padding: 12px 16px; background: #e8e8e8;
                            color: #333; font-size: 13px; }
    .secret-box .copy-btn:hover { background: #d0d0d0; }
    .setup-qr { text-align: center; margin: 16px 0; }
    .setup-qr img { width: 200px; height: 200px; image-rendering: pixelated; }
    .error { color: #e74c3c; margin-top: 8px; font-size: 14px; }
</style>
</head>
<body>
<div class="card">
    <h1>📱 Register New User</h1>
    <form id="registerForm">
        <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" placeholder="e.g. alice" required autocomplete="off">
        </div>
        <button type="submit" id="submitBtn">Register</button>
    </form>
    <div class="error" id="error"></div>
    <div class="result" id="result">
        <h2>✅ User Registered</h2>
        <div class="setup-qr" id="setupQrContainer"></div>
        <p style="font-size:14px;color:#666;margin-bottom:12px;text-align:center;">
            Scan this QR with Google Authenticator or any TOTP app
        </p>
        <div class="form-group">
            <label>User ID</label>
            <div class="secret-box">
                <input type="text" id="userId" readonly>
                <button class="copy-btn" onclick="copyField('userId')">Copy</button>
            </div>
        </div>
        <div class="form-group">
            <label>TOTP Secret (save this!)</label>
            <div class="secret-box">
                <input type="text" id="totpSecret" readonly>
                <button class="copy-btn" onclick="copyField('totpSecret')">Copy</button>
            </div>
        </div>
        <div class="form-group">
            <label>Salt</label>
            <div class="secret-box">
                <input type="text" id="salt" readonly>
                <button class="copy-btn" onclick="copyField('salt')">Copy</button>
            </div>
        </div>
    </div>
</div>
<script>
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const btn = document.getElementById('submitBtn');
        const error = document.getElementById('error');
        if (!username) { error.textContent = 'Please enter a username'; return; }
        error.textContent = '';
        btn.disabled = true; btn.textContent = 'Registering...';
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            const data = await res.json();
            if (!res.ok) { error.textContent = data.error; btn.disabled = false; btn.textContent = 'Register'; return; }
            document.getElementById('userId').value = data.id;
            document.getElementById('totpSecret').value = data.totp_secret;
            document.getElementById('salt').value = data.salt;
            document.getElementById('setupQrContainer').innerHTML =
                `<img src="${data.setup_qr}" alt="Setup QR">`;
            document.getElementById('result').classList.add('show');
            document.getElementById('username').value = '';
        } catch (err) {
            error.textContent = 'Network error: ' + err.message;
        }
        btn.disabled = false; btn.textContent = 'Register';
    });
    function copyField(id) {
        const el = document.getElementById(id);
        navigator.clipboard.writeText(el.value).then(() => {
            const btn = el.nextElementSibling;
            const orig = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = orig, 1500);
        });
    }
</script>
</body>
</html>"""


# ── Static file serving (client & verifikator) ──────────────────────────

STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")


@app.route("/verifikator/")
@app.route("/verifikator")
def verifikator_index():
    return send_from_directory(
        os.path.join(STATIC_DIR, "verifikator"), "index.html"
    )


@app.route("/verifikator/<path:filename>")
def verifikator_static(filename):
    return send_from_directory(
        os.path.join(STATIC_DIR, "verifikator"), filename
    )


@app.route("/client/")
@app.route("/client")
def client_index():
    return send_from_directory(
        os.path.join(STATIC_DIR, "client"), "index.html"
    )


@app.route("/client/<path:filename>")
def client_static(filename):
    return send_from_directory(os.path.join(STATIC_DIR, "client"), filename)


if __name__ == "__main__":
    init_db()
    print("🚀 Server running at http://localhost:5000")
    print("📝 Register page: http://localhost:5000/register")
    print("📱 Client PWA:   http://localhost:5000/client")
    print("📷 Verifikator:  http://localhost:5000/verifikator")
    app.run(host="0.0.0.0", port=5000, debug=True)
