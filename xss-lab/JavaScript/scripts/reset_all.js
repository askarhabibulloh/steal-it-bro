const sqlite3 = require("sqlite3").verbose();
const { exec } = require("child_process");

const db = new sqlite3.Database("./xss_lab.db");

console.log("Resetting users, posts, and comments...");

db.serialize(() => {
  db.run("DELETE FROM comments", function (err) {
    if (err) {
      console.error("Error deleting comments:", err.message);
      return db.close();
    }
    console.log(`Deleted ${this.changes} comments`);

    db.run("DELETE FROM posts", function (postErr) {
      if (postErr) {
        console.error("Error deleting posts:", postErr.message);
        return db.close();
      }
      console.log(`Deleted ${this.changes} posts`);

      db.run("DELETE FROM users", function (userErr) {
        if (userErr) {
          console.error("Error deleting users:", userErr.message);
          return db.close();
        }
        console.log(`Deleted ${this.changes} users`);

        db.close((closeErr) => {
          if (closeErr) {
            console.error("Error closing database:", closeErr.message);
            process.exit(1);
          }

          console.log("Running seeder to restore default data...");
          exec("node scripts/seed_posts.js", (error, stdout, stderr) => {
            if (stdout) process.stdout.write(stdout);
            if (stderr) process.stderr.write(stderr);

            if (error) {
              console.error(`Seeder error: ${error.message}`);
              process.exit(1);
            }

            console.log("Reset complete.");
            process.exit(0);
          });
        });
      });
    });
  });
});
