require("dotenv").config();
const path = require("path");
const cors = require("cors");
const express = require("express");
const app = express();

const port = process.env.PORT || 9001;

app.use(cors({
    origin: "*",
}));
app.use("/static", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.send("Hello World!");
})

app.listen(port, () => {
    console.log(`Listening on port http://localhost:${port}`);
});
