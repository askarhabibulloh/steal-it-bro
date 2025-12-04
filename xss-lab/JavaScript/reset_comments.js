const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./xss_lab.db');

db.run("DELETE FROM comments", function(err) {
    if (err) {
        console.error('Error:', err.message);
    } else {
        console.log(`Deleted ${this.changes} comments`);
    }
    db.close();
});