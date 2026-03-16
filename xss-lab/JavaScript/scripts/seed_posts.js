const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

const db = new sqlite3.Database("./xss_lab.db");

function closeDb(code = 0) {
  db.close((err) => {
    if (err) {
      console.error("Error closing database:", err.message);
      process.exit(1);
    }
    process.exit(code);
  });
}

function seedPosts() {
  db.get("SELECT COUNT(*) as count FROM posts", (err, row) => {
    if (err) {
      console.error("Error checking posts:", err.message);
      return closeDb(1);
    }

    if (row && row.count > 0) {
      console.log("Posts already exist; skipping seeding");
      return closeDb(0);
    }

    const posts = [
      {
        title: "Exploring XSS 101",
        content: "Belajar XSS dengan aman di lab ini. Selamat mencoba.",
        image_path: "images/post1.jpg",
      },
      {
        title: "Reflected XSS Example",
        content: "Contoh Reflected XSS dan mitigasi yang tepat.",
        image_path: "images/post2.jpg",
      },
      {
        title: "Stored XSS Case Study",
        content: "Studi kasus stored XSS pada sistem komentar.",
        image_path: "images/post3.jpg",
      },
      {
        title: "DOM XSS Practice",
        content: "Kenali DOM-based XSS dan skenario eksploitasi umum.",
        image_path: "images/post1.jpg",
      },
      {
        title: "Sanitization Tips",
        content: "Praktik terbaik sanitasi input dan output untuk cegah XSS.",
        image_path: "images/post2.jpg",
      },
      {
        title: "Bypass Filter 01",
        content: "Belajar cara filter sederhana bisa dibypass.",
        image_path: "images/post3.jpg",
      },
      {
        title: "Bypass Filter 02",
        content: "Bandingkan pendekatan allowlist dan denylist.",
        image_path: "images/post1.jpg",
      },
      {
        title: "Payload Encoding",
        content: "Eksperimen URL encoding dan HTML entities pada payload.",
        image_path: "images/post2.jpg",
      },
      {
        title: "Defensive Output Encoding",
        content: "Output encoding yang benar untuk konteks HTML dan atribut.",
        image_path: "images/post3.jpg",
      },
      {
        title: "Checklist Review",
        content: "Checklist pengujian XSS untuk developer dan pentester.",
        image_path: "images/post1.jpg",
      },
    ];

    const stmt = db.prepare(
      "INSERT INTO posts (title, content, image_path) VALUES (?, ?, ?)",
    );
    posts.forEach((p) => stmt.run(p.title, p.content, p.image_path));
    stmt.finalize((finalizeErr) => {
      if (finalizeErr) {
        console.error("Error inserting posts:", finalizeErr.message);
        return closeDb(1);
      }
      console.log(`Seeded ${posts.length} default posts`);
      closeDb(0);
    });
  });
}

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);

  db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        image_path TEXT
    )`);

  db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER,
        user_id INTEGER,
        content TEXT
    )`);

  db.get(
    "SELECT COUNT(*) as count FROM users WHERE username = 'admin'",
    (err, row) => {
      if (err) {
        console.error("Error checking admin user:", err.message);
        return closeDb(1);
      }

      if (!row || row.count === 0) {
        const hashed = bcrypt.hashSync("admin", 10);
        db.run(
          "INSERT INTO users (username, password) VALUES (?, ?)",
          ["admin", hashed],
          (insertErr) => {
            if (insertErr) {
              console.error("Error creating admin user:", insertErr.message);
              return closeDb(1);
            }
            console.log(
              "Created default admin user (username: admin, password: admin)",
            );
            seedPosts();
          },
        );
      } else {
        console.log("Admin user exists");
        seedPosts();
      }
    },
  );
});
