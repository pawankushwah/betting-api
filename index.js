require("dotenv").config();
const path = require("path");
const express = require("express");
const app = express();
const corsVercel = require("allowCors");

const port = process.env.PORT || 9001;

app.use("/", express.static(path.join(__dirname, "public")));

const swAPI = require("./sw-api.js");
const claimStrike = require("./claimStrike.js");
app.use("/api", swAPI);
app.use("/strike", claimStrike);

app.listen(port, () => {
    console.log(`Listening on port http://localhost:${port}`);
});
