require("dotenv").config();
const path = require("path");
const cors = require("cors");
const express = require("express");
const app = express();

const port = process.env.PORT || 9001;

app.use(cors({ origin: "*" }));

app.use("/", express.static(path.join(__dirname, "public")));

const swAPI = require("./sw-api.js");
app.use("/api", swAPI);

app.listen(port, () => {
    console.log(`Listening on port http://localhost:${port}`);
});
