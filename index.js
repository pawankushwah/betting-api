require("dotenv").config();
const path = require("path");
const cors = require("cors");
const express = require("express");
const app = express();

const port = process.env.PORT || 9001;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use("/", express.static(path.join(__dirname, "public")));

const swAPI = require("./sw-api.js");
const claimStrike = require("./claimStrike.js");
app.use("/api", swAPI);
app.use("/strike", claimStrike);

app.listen(port, () => {
    console.log(`Listening on port httap://localhost:${port}`);
});
