import sqlite3
import os
import secrets
import pyotp

DB_PATH = os.path.join(os.path.dirname(__file__), "database.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            totp_secret TEXT NOT NULL,
            unique_salt TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    conn.close()


def create_user(username):
    """Create a new user with TOTP secret and unique salt. Returns user dict."""
    user_id = secrets.token_hex(8)
    totp_secret = pyotp.random_base32()
    unique_salt = secrets.token_hex(16)

    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO users (id, username, totp_secret, unique_salt) VALUES (?, ?, ?, ?)",
            (user_id, username, totp_secret, unique_salt),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return None

    conn.close()
    return {
        "id": user_id,
        "username": username,
        "totp_secret": totp_secret,
        "salt": unique_salt,
    }


def get_user(user_id):
    """Get user by ID."""
    conn = get_connection()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()

    if row is None:
        return None
    return dict(row)


def get_all_users():
    """Get all users (without secret)."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT id, username, unique_salt, created_at FROM users ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
