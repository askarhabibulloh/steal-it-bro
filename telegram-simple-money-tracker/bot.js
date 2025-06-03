require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");
const os = require("os");
const db = require("./db");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ALLOWED_CHAT_ID = parseInt(process.env.ALLOWED_CHAT_ID);

// Fungsi cek chat yang diizinkan
function isAllowed(msg) {
  return msg.chat && msg.chat.id === ALLOWED_CHAT_ID;
}

// Kirim ringkasan saldo
function kirimRingkasan(chatId) {
  db.all(`SELECT * FROM transactions`, (err, rows) => {
    if (err) return bot.sendMessage(chatId, "❌ Gagal mengambil data.");

    let income = 0,
      expense = 0;
    rows.forEach((row) => {
      if (row.amount > 0) income += row.amount;
      else expense += row.amount;
    });

    const saldo = income + expense;
    const text =
      `💰 *Ringkasan*\n\n` +
      `➕ Total Pemasukan: Rp${income.toLocaleString("id-ID")}\n` +
      `➖ Total Pengeluaran: Rp${Math.abs(expense).toLocaleString("id-ID")}\n` +
      `🧮 Sisa Saldo: *Rp${saldo.toLocaleString("id-ID")}*`;

    bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
  });
}

// Ekspor transaksi ke CSV
function exportCsv(chatId) {
  db.all(`SELECT * FROM transactions ORDER BY timestamp ASC`, (err, rows) => {
    if (err || !rows.length) {
      return bot.sendMessage(chatId, "❌ Gagal mengekspor atau data kosong.");
    }

    const header = "id,amount,type,description,timestamp";
    const lines = rows.map(
      (row) =>
        `${row.id},${row.amount},${row.type},${row.description},${row.timestamp}`
    );
    const content = [header, ...lines].join(os.EOL);

    const filePath = path.join(__dirname, "export.csv");
    fs.writeFileSync(filePath, content);

    bot.sendDocument(
      chatId,
      filePath,
      {},
      {
        filename: `money-tracker-${Date.now()}.csv`,
      }
    );
  });
}

// Handler utama
bot.on("message", (msg) => {
  if (!isAllowed(msg)) return;

  const text = msg.text.trim();

  // Tambah uang
  if (text.startsWith("+")) {
    const match = /^\+\s*(\d+)\s*(.+)?$/.exec(text);
    if (!match)
      return bot.sendMessage(
        msg.chat.id,
        "❌ Format salah. Contoh: + 100000 gaji"
      );

    const amount = parseInt(match[1]);
    const desc = match[2] || "no_desc";

    db.run(
      `INSERT INTO transactions (amount, type, description) VALUES (?, 'income', ?)`,
      [amount, desc],
      (err) => {
        if (err)
          return bot.sendMessage(msg.chat.id, "❌ Gagal menyimpan data.");
        bot
          .sendMessage(
            msg.chat.id,
            `✅ Ditambahkan: +${amount.toLocaleString("id-ID")} (${desc})`
          )
          .then(() => kirimRingkasan(msg.chat.id));
      }
    );

    // Kurangi uang
  } else if (text.startsWith("-")) {
    const match = /^-\s*(\d+)\s*(.+)?$/.exec(text);
    if (!match)
      return bot.sendMessage(
        msg.chat.id,
        "❌ Format salah. Contoh: - 20000 jajan"
      );

    const amount = parseInt(match[1]);
    const desc = match[2] || "no_desc";

    db.run(
      `INSERT INTO transactions (amount, type, description) VALUES (?, 'expense', ?)`,
      [-amount, desc],
      (err) => {
        if (err)
          return bot.sendMessage(msg.chat.id, "❌ Gagal menyimpan data.");
        bot
          .sendMessage(
            msg.chat.id,
            `✅ Dikurangi: -${amount.toLocaleString("id-ID")} (${desc})`
          )
          .then(() => kirimRingkasan(msg.chat.id));
      }
    );

    // Reset semua data
  } else if (text.toLowerCase() === "reset") {
    bot
      .sendDocument(
        msg.chat.id,
        "database.sqlite",
        {},
        {
          filename: `money-tracker-${Date.now()}.sqlite`,
        }
      )
      .then(() => {
        db.run(`DELETE FROM transactions`, (err) => {
          if (err) return bot.sendMessage(msg.chat.id, "❌ Gagal reset data.");
          bot.sendMessage(msg.chat.id, "✅ Semua data telah dihapus.");
        });
      });

    // Ekspor ke CSV
  } else if (text.toLowerCase() === "export") {
    exportCsv(msg.chat.id);

    // Perintah tidak dikenali
  } else {
    bot.sendMessage(
      msg.chat.id,
      "Perintah tidak dikenali. Gunakan:\n\n" +
        "➕ `+ jumlah keterangan`\n" +
        "➖ `- jumlah keterangan`\n" +
        "♻️ `reset` untuk hapus semua data\n" +
        "📄 `export` untuk unduh data CSV"
    );
  }
});
