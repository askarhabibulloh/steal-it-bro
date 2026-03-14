#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const repoRoot = path.join(__dirname, "..");
const targets = [
  "admin-cookies.txt",
  "cookies.txt",
  "final-cookies.txt",
  "final3-cookies.txt",
  "final4-cookies.txt",
  "final5-cookies.txt",
  "footer-cookies.txt",
  "footer2-cookies.txt",
  "new-cookies.txt",
  "order-cookies.txt",
  "order2-cookies.txt",
  "order3-cookies.txt",
  "order4-cookies.txt",
  "test-cookies.txt",
  "user-cookies.txt",
  "bot.log",
];

console.log("Cleaning artefacts...");
let removed = 0;
for (const t of targets) {
  const p = path.join(repoRoot, t);
  if (fs.existsSync(p)) {
    try {
      fs.unlinkSync(p);
      console.log("Removed", t);
      removed++;
    } catch (err) {
      console.warn("Failed to remove", t, err.message);
    }
  }
}

// remove screenshots dir if exists
const screenshots = path.join(repoRoot, "screenshots");
if (fs.existsSync(screenshots)) {
  try {
    fs.rmSync(screenshots, { recursive: true, force: true });
    console.log("Removed screenshots/");
    removed++;
  } catch (err) {
    console.warn("Failed to remove screenshots/", err.message);
  }
}

console.log(`Done. ${removed} artefacts removed.`);
process.exit(0);
