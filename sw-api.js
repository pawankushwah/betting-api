const express = require("express");
const router = express.Router();

const webpush = require("web-push");

const apiKeys = {
    public: "BEUHB1ebqAkHNLf6aXXXi-Q2rnOChY1zsty4a9C07RvmRpNPjp18Uk7nt-o-8ET7JXoRKJxQ6pP00KM9_rammlo",
    private: "_74K4YDO8adRgfEQDvUqWp0VVFm3c9-7dwWu46cMJFA"
}
webpush.setVapidDetails(
    "mailto:pawangame.com@gmail.com",
    apiKeys.public,
    apiKeys.private
)

router.use(express.json());

const subDatabase = [];

router.get("/", (req, res) => {
    res.send({status: "success", message: "helo world!!"});
})

router.post("/save-subscription", (req, res) => {
    subDatabase.push(req.body);
    console.log(subDatabase);
    res.send({ success: true, message: "Subsription Saved" });
})

router.get("/send-notification", (req, res) => {
    webpush.sendNotification(subDatabase[0], "Hello World!!");
    res.send({status: "success", message: "message send to push service"});
})

module.exports = router;