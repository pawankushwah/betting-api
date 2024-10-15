const express = require("express");
const { dbConnect, model } = require("./databaseUtil/models");
const router = express.Router();
require("dotenv").config();

// sqlite related
// const sqlite3 = require("sqlite3").verbose();
// const path = require("node:path");
// const file = path.join(__dirname, "sqlite", "heister.db");

// global variables and constants
const BOT_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_API_TOKEN_ID}/`;

router.use(express.json());

createDatabaseIfNotExists().then((db) => {
    return createUserTable(db);
}).then(() => {
    console.log("Database is ready to use.");
}).catch((err) => {
    console.error("Error creating database:", err);
});

router.post("/echohook", async (req, res) => {
    try {
        const chatId = parseInt(req.body.message.chat.id);
        const text = req.body.message.text.toString();
        await sendRequest(BOT_URL, "sendMessage", { chat_id: chatId, text: text });
        return res.sendStatus(200);
    } catch (err) {
        console.error(err); // Log the error for debugging
        return res.status(500).send({ message: "An error occurred. Please try again later." });
    }
});

router.post("/getBotToken", (req, res) => {
    res.send({ token: process.env.TELEGRAM_BOT_API_TOKEN_ID });
})

router.post("/checkUser", (req, res) => {
    try {
        const data = req.body;
        let chatId, username;
        if (data?.id) {
            chatId = parseInt(data.id);
        } else if (data?.username) {
            username = isValidTelegramUsername(data.username) ? data.username.slice(1) : null;
        } else {
            throw new Error("chat_id or username is required");
        }

        // Checking user data in database
        if (chatId) {
            checkUser(chatId).then((storedIn) => {
                storedIn.mongoDB ? res.send({ code: 0, message: "success", data: storedIn.data }) : res.send({ code: -1, message: "user not found: start the bot", data: {} });
            }).catch((err) => {
                throw new Error(err.message);
            })
        } else if (username) {
            checkUserByUsername(username).then((storedIn) => {
                storedIn.mongoDB ? res.send({ code: 0, message: "success", data: storedIn.data }) : res.send({ code: -1, message: "user not found: start the bot" });
            }).catch((err) => {
                throw new Error(err.message);
            })
        }
    } catch (error) {
        console.log(error);
        res.send({ code: -1, message: error.message });
    }
})

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
        // if (isUserExistsIn.sqlite) {
            if (isUserExistsIn.mongoDB) {
                await updateUserInMongoDB(req.body.message.chat);
            } else {
                await storeUserInMongoDB(req.body.message.chat);
            }
            // await storeUserInSqlite(req.body.message.chat);
        // } else {
            // await updateUserInSqlite(req.body.message.chat);
        // }

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

function isValidTelegramUsername(username) {
    const telegramUsernameRegex = /^@[a-zA-Z0-9_]+$/;
    if (telegramUsernameRegex.test(username) && username.length >= 5 && username.length <= 32) {
        return true;
    } else {
        return false;
    }
}

// creating data base if not exists
// function createDatabaseIfNotExists() {
//     return new Promise((resolve, reject) => {
//         const db = new sqlite3.Database(file, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 console.log("Database created successfully.");
//                 resolve(db);
//             }
//         });
//     });
// }

// function createUserTable(db) {
//     return new Promise((resolve, reject) => {
//         db.run(`CREATE TABLE IF NOT EXISTS users (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         chat_id STRING NOT NULL UNIQUE,
//         first_name STRING NOT NULL,
//         username STRING NOT NULL UNIQUE
//       )`, (err) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 console.log("User table created successfully.");
//                 resolve();
//             }
//         });
//     });
// }

// async function runQuery(query, params) {
//     const db = new sqlite3.Database(file, sqlite3.OPEN_READWRITE, (err) => {
//         if (err) throw new Error(err.message);
//     })
//     return new Promise((resolve, reject) => {
//         const row = db.run(query, params, (err) => {
//             if (err) {
//                 reject(err);
//             }
//         });
//         resolve(row);
//     });
// }

async function checkUser(id) {
    const storedIn = {
        sqlite: true,
        mongoDB: true,
        data: {}
    }
    // connect to sqlite
    // const db = new sqlite3.Database(file, sqlite3.OPEN_READWRITE, (err) => {
    //     if (err) throw new Error(err.message);
    // })

    // // checking the user data in the SQLite database
    // try {
    //     const sql = `SELECT * FROM users WHERE chat_id = ?`;
    //     const row = await runQuery(sql, [id]);
    //     if (row[0]) {
    //         storedIn.data = row[0];
    //         return storedIn;
    //     } else {
    //         console.log("user does not exists in sqlite");
    //         storedIn.sqlite = false;
    //     }
    // } catch (err) {
    //     throw new Error(err.message);
    // } finally {
    //     db.close();
    // }

    // if (storedIn.sqlite) return storedIn;

    try {
        // connecting to the database
        await dbConnect();

        // checking for data in the mongoDB database
        const users = await model("users");
        let response = await users.findOne({ id: id });
        if (response) {
            storedIn.data = response;
            return storedIn;
        }
        console.log("user does not exists in mongoDB");
        storedIn.mongoDB = false;
    } catch (err) {
        throw new Error(err.message);
    }
    return storedIn;
}

async function checkUserByUsername(username) {
    let storedIn = {
        sqlite: true,
        mongoDB: true,
        data: {}
    }
    // // connect to sqlite
    // const db = new sqlite3.Database(file, sqlite3.OPEN_READWRITE, (err) => {
    //     if (err) throw new Error(err.message);
    // })

    // // checking the user data in the SQLite database
    // try {
    //     const sql = `SELECT * FROM users WHERE username = ?`;
    //     const row = await runQuery(sql, [username]);
    //     if (row[0]) {
    //         storedIn.data = row[0];
    //         return storedIn;
    //     } else {
    //         console.log("user does not exists in sqlite");
    //         storedIn.sqlite = false;
    //     }
    // } catch (err) {
    //     throw new Error(err.message);
    // } finally {
    //     db.close();
    // }

    // if (storedIn.sqlite) return storedIn;

    try {
        // connecting to the database
        await dbConnect();

        // checking for data in the mongoDB database
        const users = await model("users");
        let response = await users.findOne({ username: username });
        if (response) {
            storedIn.data = response;
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
        console.log(response);
        if (!response.acknowledged) throw new Error("unable to update data in database");
    } catch (err) {
        throw new Error(err.message);
    }
    return true;
}

// async function storeUserInSqlite(data) {
//     // stores in sqlite database
//     // connect to sqlite
//     const db = new sqlite3.Database(file, sqlite3.OPEN_READWRITE, (err) => {
//         if (err) throw new Error(err.message);
//     })
    
//     // Inserting data into the table
//     let sql = `INSERT INTO users (chat_id, username, first_name) VALUES (?, ?, ?)`;
//     db.run(sql, [data.id, data.username, data.first_name], (err) => {
//         if (err) throw new Error("Unable to save data in cache" + err.message);
//     });
//     db.close();
//     return true;
// }

// async function updateUserInSqlite(data) {
//     // updates in sqlite database
//     // connect to sqlite
//     const db = new sqlite3.Database(file, sqlite3.OPEN_READWRITE, (err) => {
//         if (err) throw new Error(err.message);
//     })

//     // Inserting data into the table
//     let sql = `UPDATE users SET username = ? WHERE chat_id = ?`;
//     db.run(sql, [data.username, data.id], (err) => {
//         if (err) throw new Error("Unable to update data in cache");
//     });
//     db.close();
//     return true;
// }

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