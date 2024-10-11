const express = require("express");
const { dbConnect, model } = require("./databaseUtil/models");
const router = express.Router();
require("dotenv").config();

// sqlite related
const sqlite3 = require("sqlite3").verbose();
const path = require("node:path");
const file = path.join(__dirname, "sqlite", "heister.db");

// global variables and constants
const BOT_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_API_TOKEN_ID}/`;

router.use(express.json());

router.post("/echohook", async (req, res) => {
    try {
        const chatId = parseInt(req.body.message.chat.id);
        const text = req.body.message.text.toString();
        await sendRequest(BOT_URL, "sendMessage", { chat_id, text });
        return res.sendStatus(200);
    } catch (err) {
        console.error(err); // Log the error for debugging
        return res.status(500).send({ message: "An error occurred. Please try again later." });
    }
});

router.post("/webhook", async (req, res) => {
    try {
        // Checking user data in database
        const chatId = parseInt(req.body.message.chat.id);
        const isUserExistsIn = await checkUser(chatId);

        // Sending message to the user
        const messageId = await sendRequest(BOT_URL, "sendMessage", {
            chat_id: chatId,
            text: "Message sent ✅"
        });

        // Delete the sent message after a short delay (optional)
        // await new Promise((resolve) => setTimeout(resolve, 1000));
        await sendRequest(BOT_URL, "deleteMessage", { chat_id: chatId, message_id: messageId });

        // Storing or updating user data
        if (!isUserExistsIn.sqlite) {
            if (isUserExistsIn.mongoDB) {
                await updateUserInMongoDB(req.body.message.chat);
            } else {
                await storeUserInMongoDB(req.body.message.chat);
            }
            await storeUserInSqlite(req.body.message.chat);
        } else {
            await updateUserInSqlite(req.body.message.chat);
        }

        // Process message with escaped username
        const username = req.body.message.chat.username.replace(/_/g, '\\_').replace(/\*/g, '\\*');
        await sendRequest(BOT_URL, "sendMessage", {
            chat_id: chatId,
            text: `Data Updated ✅\nEnter you @${username} in TC to get started\nAlternatively, you can use \`${chatId}\` to get started\nAfter that, I will be able to send Images of strikes to you`,
            parse_mode: "MarkdownV2"
        });

        return res.send({ code: 0, status: "success" });
    } catch (err) {
        console.error(err); // Log the error for debugging
        return res.status(500).send({ message: "An error occurred. Please try again later." });
    }
});

// creating data base if not exists
function createDatabaseIfNotExists() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(file, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                reject(err);
            } else {
                console.log("Database created successfully.");
                resolve(db);
            }
        });
    });
}

function createUserTable(db) {
    return new Promise((resolve, reject) => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id STRING NOT NULL UNIQUE,
        first_name STRING NOT NULL,
        username STRING NOT NULL UNIQUE
      )`, (err) => {
            if (err) {
                reject(err);
            } else {
                console.log("User table created successfully.");
                resolve();
            }
        });
    });
}

createDatabaseIfNotExists().then((db) => {
    return createUserTable(db);
}).then(() => {
    console.log("Database is ready to use.");
}).catch((err) => {
    console.error("Error creating database:", err);
});

async function checkUser(id) {
    const storedIn = {
        sqlite: true,
        mongoDB: true
    }
    // connect to sqlite
    const db = new sqlite3.Database(file, sqlite3.OPEN_READWRITE, (err) => {
        if (err) throw new Error(err.message);
    })

    // checking the user data in the SQLite database
    let sql = `SELECT * FROM users WHERE chat_id = ?`;
    db.all(sql, [id], (err, row) => {
        if (err) throw new Error(err.message);
        if (row[0]) return;
        console.log("user does not exists in cache", row);
        storedIn.sqlite = false;
    });
    db.close();
    if (storedIn.sqlite) return storedIn;

    try {
        // connecting to the database
        await dbConnect();

        // checking for data in the mongoDB database
        const users = await model("users");
        let response = await users.findOne({ id: id });
        if (response) {
            storedIn.mongoDB = true;
            return storedIn;
        }
        console.log("user does not exists in mongoDB");
        storedIn.mongoDB = false;
    } catch (err) {
        throw new Error(err.message);
    }
    return storedIn;
}

async function storeUserInMongoDB(data) {
    // stores in mongoDB database
    try {
        await dbConnect();
        const users = await model("users");
        let response = await users.insertMany([{
            id: data.id,
            first_name: data.first_name,
            username: data.username,
            type: data.type
        }]);
        console.log(response);
        if (!response.acknowledged) throw new Error("unable to save data in database");
    } catch (err) {
        throw new Error(err.message);
    }
    return true;
}

async function updateUserInMongoDB(data) {
    // stores in mongoDB database
    try {
        await dbConnect();
        const users = await model("users");
        // console.log(users);
        let response = await users.updateOne({
            id: data.id
        }, {
            $set: { ...data }
        });
        // console.log(response);
        if (!response.acknowledged) throw new Error("unable to update data in database");
    } catch (err) {
        throw new Error(err.message);
    }
    return true;
}

async function storeUserInSqlite(data) {
    // stores in sqlite database
    // connect to sqlite
    const db = new sqlite3.Database(file, sqlite3.OPEN_READWRITE, (err) => {
        if (err) throw new Error(err.message);
    })

    // Inserting data into the table
    let sql = `INSERT INTO users (chat_id, username, first_name) VALUES (?, ?, ?)`;
    db.run(sql, [data.id, data.username, data.first_name], (err) => {
        if (err) throw new Error("Unable to save data in cache");
    });
    db.close();
    return true;
}

async function updateUserInSqlite(data) {
    // updates in sqlite database
    // connect to sqlite
    const db = new sqlite3.Database(file, sqlite3.OPEN_READWRITE, (err) => {
        if (err) throw new Error(err.message);
    })

    // Inserting data into the table
    let sql = `UPDATE users SET username = ? WHERE chat_id = ?`;
    db.run(sql, [data.username, data.id], (err) => {
        if (err) throw new Error("Unable to update data in cache");
    });
    db.close();
    return true;
}

async function sendRequest(botURL, endpoint, params) {
    let url = new URL(botURL + endpoint);
    try {
        let response = await fetch(url.href, {
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify(params)
        });
        let json = await response.json();
        if (json.ok) return json.result.message_id;
        else throw new Error(`${json.error_code}: ${json.description}`);
    } catch (err) {
        throw new Error(err);
    }
}

module.exports = router;