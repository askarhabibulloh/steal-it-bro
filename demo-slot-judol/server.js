const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.json());
app.use(express.static("public"));

const SETTINGS_FILE = path.join(__dirname, "settings.json");
const COUNTER_FILE = path.join(__dirname, "counter.json");

function getSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE));
  } catch (err) {
    return { forceWin: false, forceLoss: false };
  }
}

function getCounter() {
  try {
    return JSON.parse(fs.readFileSync(COUNTER_FILE));
  } catch (err) {
    return { wins: 0, losses: 0 };
  }
}

function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

function saveCounter(counter) {
  fs.writeFileSync(COUNTER_FILE, JSON.stringify(counter, null, 2));
}

app.get("/", (req, res) => {
  res.render("player", { isAdmin: false });
});

app.get("/admin", (req, res) => {
  res.render("admin", { isAdmin: true });
});

app.get("/counter", (req, res) => {
  const counter = getCounter();

  if (req.headers.accept && req.headers.accept.includes("application/json")) {
    res.json(counter);
  } else {
    res.render("counter", counter);
  }
});

app.get("/counter/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${JSON.stringify(getCounter())}\n\n`);

  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify(getCounter())}\n\n`);
  }, 1000);

  req.on("close", () => {
    clearInterval(interval);
    res.end();
  });
});

app.post("/spin", (req, res) => {
  try {
    const { isAdmin } = req.body;
    if (typeof isAdmin !== "boolean") {
      return res.status(400).json({ error: "Invalid request" });
    }

    const adminSettings = getSettings();
    const counter = getCounter();

    let result;
    if (adminSettings.forceWin) {
      const symbols = [
        "🍒",
        "🍋",
        "🍊",
        "⭐",
        "7",
        "🍇",
        "🍉",
        "🍓",
        "🍍",
        "🍎",
        "🍐",
        "🍑",
      ];
      const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      result = {
        reels: Array(7).fill(randomSymbol),
        message: `JACKPOT! ${randomSymbol.repeat(3)} (Admin Force Win)`,
        isWin: true,
      };
      counter.wins++;
    } else if (adminSettings.forceLoss) {
      const symbols = ["🍒", "🍋", "🍊"];
      let reels = [];
      const firstSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      reels.push(firstSymbol);
      for (let i = 1; i < 7; i++) {
        let symbol;
        do {
          symbol = symbols[Math.floor(Math.random() * symbols.length)];
        } while (i < 2 && symbol === firstSymbol);
        reels.push(symbol);
      }
      result = {
        reels,
        message: "KALAH! (Mode force loss aktif)",
        isWin: false,
      };
      counter.losses++;
    } else {
      const symbols = [
        "🍒",
        "🍋",
        "🍊",
        "⭐",
        "7",
        "🍇",
        "🍉",
        "🍓",
        "🍍",
        "🍎",
        "🍐",
        "🍑",
      ];
      const reels = Array(7)
        .fill()
        .map(() => symbols[Math.floor(Math.random() * symbols.length)]);

      const firstSymbol = reels[0];
      const isWin = reels.every((symbol) => symbol === firstSymbol);
      result = {
        reels,
        message: isWin ? "JACKPOT! Semua simbol sama!" : "KALAH! (Normal)",
        isWin,
      };
      if (isWin) counter.wins++;
      else counter.losses++;
    }
    saveCounter(counter);
    res.json(result);
  } catch (error) {
    console.error("Spin error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/admin/settings", (req, res) => {
  const newSettings = req.body;
  saveSettings(newSettings);
  res.json({ success: true, settings: newSettings });
});

app.post("/admin/reset-counter", (req, res) => {
  saveCounter({ wins: 0, losses: 0 });
  res.json({ success: true });
});

if (!fs.existsSync(SETTINGS_FILE)) {
  saveSettings({ forceWin: false, forceLoss: false });
}

if (!fs.existsSync(COUNTER_FILE)) {
  saveCounter({ wins: 0, losses: 0 });
}

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  console.log(`Settings file: ${SETTINGS_FILE}`);
  console.log(`Counter file: ${COUNTER_FILE}`);
});
