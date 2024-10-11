const sqlite3 = require("sqlite3").verbose();
const path = require("node:path");
const file = path.resolve(__dirname, "test.db");
let sql;

// connect to DB
const db = new sqlite3.Database(file, sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
})

// create Table
sql = `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id STRING NOT NULL UNIQUE,
    first_name STRING NOT NULL,
    username STRING NOT NULL UNIQUE
)`;
db.run(sql);

// drop table
db.run("DROP TABLE users")

// Inserting data into the table
sql = `INSERT INTO users (chat_id, first_name, username) VALUES (?, ?, ?)`;
db.run(sql, ["12345", "annodiya", "annodiya"], (err) => {
    if (err) return console.error(err.message);
    console.log("Row inserted");
});

// update the data
sql = `UPDATE users SET username = ? WHERE chat_id = ?`;
db.run(sql, ["Muskan", "-2323"], (err) => {
    if (err) return console.error(err.message);
    console.log("Row updated");
});

// delete the data
sql = `DELETE FROM users WHERE chat_id = ?`;
db.run(sql, [5055723868], (err) => {
    if (err) return console.error(err.message);
    console.log("Row deleted");
});

// query the data
sql = `SELECT * FROM users`;
db.all(sql, [], (err, rows) => {
    if (err) return console.error(err.message);
    rows.forEach((row) => console.log(row))
})

// query data by id
// const storedIn = { sqlite: true, mongoDB: true }
// sql = `SELECT * FROM users WHERE chat_id = ?`;
// db.all(sql, [5055723868], (err, row) => {
//     if (err) throw new Error(err.message);
//     console.log(row);
//     if (!row[0]) {
//         console.log("user does not exists in cache", row);
//         storedIn.sqlite = false;
//     }
// });
// console.log(storedIn);

db.close();