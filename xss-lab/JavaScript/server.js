const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const PORT = 3000;

// Database setup
const db = new sqlite3.Database("./xss_lab.db");

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(
  session({
    secret: "xss-lab-secret",
    resave: false,
    saveUninitialized: true,
  }),
);

// Initialize database
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
        content TEXT,
        FOREIGN KEY (post_id) REFERENCES posts(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

  // Sample posts
  db.get("SELECT COUNT(*) as count FROM posts", (err, row) => {
    if (row.count === 0) {
      const posts = [
        {
          title: "Exploring XSS 101",
          content: "Belajar XSS dengan aman di lab ini. Selamat mencoba.",
          image_path: "images/post1.jpg",
        },
        {
          title: "Reflected XSS Example",
          content: "Contoh reflected XSS dan mitigasi yang tepat.",
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
      posts.forEach((post) => {
        stmt.run(post.title, post.content, post.image_path);
      });
      stmt.finalize();
    }
  });
});

// Routes
app.get("/", (req, res) => {
  db.all("SELECT * FROM posts", (err, posts) => {
    const feedHtml = `
            <main class="feed">
                ${posts
                  .map(
                    (post) => `
                    <article class="post-card">
                        <div class="post-meta">
                            <div class="avatar"></div>
                            <div>
                                <h3 class="post-title"><a href="/post/${post.id}">${escapeHtml(post.title)}</a></h3>
                                <div class="post-body">${escapeHtml(post.content.substring(0, 140))}...</div>
                            </div>
                        </div>
                        <img class="post-image" src="/${post.image_path}" alt="${escapeHtml(post.title)}">
                        <a href="/post/${post.id}" class="read-more">Baca selengkapnya</a>
                    </article>
                `,
                  )
                  .join("")}
            </main>
        `;

    res.send(
      generateHTML(
        "Home",
        `<div class="layout"><div>${feedHtml}</div><aside class="sidebar"><div class="card"><h4>About</h4><p>Educational XSS lab — safe playground.</p></div></aside></div>`,
        req.session.user_id,
      ),
    );
  });
});

app.get("/post/:id", (req, res) => {
  const postId = req.params.id;

  db.get("SELECT * FROM posts WHERE id = ?", [postId], (err, post) => {
    if (!post) {
      return res.status(404).send("Post not found");
    }

    db.all(
      `SELECT c.*, u.username 
                FROM comments c 
                JOIN users u ON c.user_id = u.id 
                WHERE c.post_id = ?`,
      [postId],
      (err, comments) => {
        const commentsHtml =
          comments.length > 0
            ? comments
                .map(
                  (comment) => `
                    <div class="comment">
                        <strong>${comment.username}</strong>
                        <p>${comment.content}</p>
                    </div>
                `,
                )
                .join("")
            : "<p>Belum ada komentar.</p>";

        const commentForm = req.session.user_id
          ? `<div class="comment-form">
                    <h4>Tambahkan Komentar</h4>
                    <form action="/comment" method="POST">
                        <input type="hidden" name="post_id" value="${postId}">
                        <textarea name="content" required placeholder="Tulis komentar Anda di sini..."></textarea>
                        <button type="submit">Kirim Komentar</button>
                    </form>
                </div>`
          : '<p><a href="/login">Login</a> untuk menambahkan komentar.</p>';

        res.send(
          generateHTML(
            post.title,
            `
                <div class="post-detail">
                    <h2>${post.title}</h2>
                  <img class="post-detail-image" src="/${post.image_path}" alt="${post.title}">
                    <div class="post-content">
                        <p>${post.content}</p>
                    </div>
                </div>
                <div class="comments">
                    <h3>Komentar</h3>
                    ${commentsHtml}
                    ${commentForm}
                </div>
            `,
            req.session.user_id,
          ),
        );
      },
    );
  });
});

app.get("/login", (req, res) => {
  res.send(
    generateHTML(
      "Login",
      `
        <div class="auth-form">
            <h2>Login</h2>
            <form method="POST" action="/login">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" id="username" name="username" placeholder="Masukkan username" required>
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" placeholder="Masukkan password" required>
                </div>
                <button type="submit">Login</button>
            </form>
            <p class="auth-links">Belum punya akun? <a href="/register">Daftar di sini</a></p>
        </div>
    `,
    ),
  );
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (user && bcrypt.compareSync(password, user.password)) {
      req.session.user_id = user.id;
      res.redirect("/");
    } else {
      res.send(
        generateHTML(
          "Login",
          `
                <div class="auth-form">
                    <h2>Login</h2>
                    <div class="error">Login failed</div>
                    <form method="POST" action="/login">
                        <div class="form-group">
                            <label for="username">Username</label>
                            <input type="text" id="username" name="username" placeholder="Masukkan username" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" name="password" placeholder="Masukkan password" required>
                        </div>
                        <button type="submit">Login</button>
                    </form>
                    <p class="auth-links">Belum punya akun? <a href="/register">Daftar di sini</a></p>
                </div>
            `,
        ),
      );
    }
  });
});

app.get("/register", (req, res) => {
  res.send(
    generateHTML(
      "Register",
      `
        <div class="auth-form">
            <h2>Register</h2>
            <form method="POST" action="/register">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" id="username" name="username" placeholder="Masukkan username" required>
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" placeholder="Masukkan password" required>
                </div>
                <button type="submit">Register</button>
            </form>
            <p class="auth-links">Sudah punya akun? <a href="/login">Login di sini</a></p>
        </div>
    `,
    ),
  );
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, hashedPassword],
    function (err) {
      if (err) {
        res.send(
          generateHTML(
            "Register",
            `
                <div class="auth-form">
                    <h2>Register</h2>
                    <div class="error">Username sudah digunakan</div>
                    <form method="POST" action="/register">
                        <div class="form-group">
                            <label for="username">Username</label>
                            <input type="text" id="username" name="username" placeholder="Masukkan username" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" name="password" placeholder="Masukkan password" required>
                        </div>
                        <button type="submit">Register</button>
                    </form>
                    <p class="auth-links">Sudah punya akun? <a href="/login">Login di sini</a></p>
                </div>
            `,
          ),
        );
      } else {
        req.session.user_id = this.lastID;
        res.redirect("/");
      }
    },
  );
});

app.post("/comment", (req, res) => {
  if (req.session.user_id && req.body.post_id && req.body.content) {
    db.run(
      "INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)",
      [req.body.post_id, req.session.user_id, req.body.content],
    );
  }
  res.redirect(`/post/${req.body.post_id}`);
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.get("/reset-comments", (req, res) => {
  if (req.session.user_id) {
    db.run("DELETE FROM comments", function (err) {
      if (err) console.error(err);
      res.redirect("/");
    });
  } else {
    res.redirect("/login");
  }
});

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function generateHTML(title, content, userId = null) {
  const navLinks = userId
    ? `<a href="/">Home</a><a href="/logout">Logout</a><a href="/reset-comments" onclick="return confirm('Hapus semua komentar?')" class="danger-link">Reset Comments</a>`
    : `<a href="/">Home</a><a href="/login">Login</a><a href="/register">Register</a>`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>XSS Lab</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/css/style.css">
        <link rel="icon" type="image/png" href="/favicon.svg">
    </head>
    <body>
        <header class="site-header">
            <div class="container topbar">
                <div class="brand">XSS Lab</div>
                <div class="search"><input placeholder="Search posts or topics..." aria-label="Search"></div>
            <div class="nav-actions"><button type="button" id="theme-toggle" class="theme-toggle" aria-label="Toggle theme">Light mode</button>${navLinks}</div>
            </div>
        </header>
        <main class="container">
            ${content}
        </main>
        <footer>
            &copy; 2024 XSS Lab - Educational Purpose Only
        </footer>
        <script>
          (function () {
            var storageKey = 'xss-lab-theme';
            var root = document.documentElement;
            var toggle = null;

            function applyTheme(theme) {
              root.setAttribute('data-theme', theme);
              if (toggle) {
                toggle.textContent = theme === 'light' ? 'Dark mode' : 'Light mode';
              }
            }

            var savedTheme = localStorage.getItem(storageKey) || 'dark';
            applyTheme(savedTheme);

            document.addEventListener('DOMContentLoaded', function () {
              toggle = document.getElementById('theme-toggle');
              applyTheme(root.getAttribute('data-theme') || 'dark');
              if (!toggle) return;

              toggle.addEventListener('click', function () {
                var currentTheme = root.getAttribute('data-theme') || 'dark';
                var nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
                applyTheme(nextTheme);
                localStorage.setItem(storageKey, nextTheme);
              });
            });
          })();
        </script>
    </body>
    </html>`;
}

app.listen(PORT, () => {
  console.log(`XSS Lab JS running on http://localhost:${PORT}`);
});
